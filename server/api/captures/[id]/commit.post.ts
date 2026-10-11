import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../../db'

interface CommitStamp {
  box: [number, number, number, number] | null
  position?: number
  area: string; country: string; year: number | null; michelNo: string; faceValue: string; motif: string; color: string
  condition: string; quantity: number; confidence: number; hint?: string; privateNote?: string; catalogValue?: string | number | null
  type?: string; series?: string; grade?: string; material?: string; mint?: string; diameterMm?: number | null; rotation?: number
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const id = getRouterParam(event, 'id')!
  const cap = await db.query.capture.findFirst({ where: and(eq(schema.capture.id, id), inArray(schema.capture.collectionId, await accessibleCollectionIds(user.id))) })
  if (!cap) throw createError({ statusCode: 404, statusMessage: 'Aufnahme nicht gefunden' })
  const body = await readBody<{ albumNumber?: number, sheet?: number, stamps: CommitStamp[] }>(event)
  if (!body?.stamps?.length) throw createError({ statusCode: 400, statusMessage: 'Keine Marken gewählt' })
  const albumId = body.albumNumber ? (await getOrCreateAlbum(c.id, Number(body.albumNumber))).id : null
  const original = await storage.get(cap.fileKey)
  const created: string[] = []
  for (const [i, s] of body.stamps.entries()) {
    const patch = pickItemPatch({ ...s, catalogValue: s.catalogValue ?? null, privateNote: s.privateNote ?? '' })
    const [it] = await db.insert(schema.item).values({
      ...(patch as any), collectionId: c.id, ownerId: c.ownerId, albumId, sheet: body.sheet ?? null, position: s.position ?? i + 1,
      aiConfidence: String(Math.max(0, Math.min(1, s.confidence ?? 0)).toFixed(3)), aiSuggestion: s, captureId: cap.id, box: s.box ?? null,
    }).returning()
    const boxOk = Array.isArray(s.box) && s.box.length === 4 && s.box.every(v => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 1000)
    let src = boxOk ? await cropBox(original, s.box!.map(Number) as [number, number, number, number]) : original
    const rot = [90, 180, 270].includes(Number(s.rotation)) ? Number(s.rotation) : 0
    if (rot) src = await rotateImage(src, rot)
    const v = await makeVariants(src)
    const key = `items/${it!.id}/${crypto.randomUUID()}`
    await storage.put(key + '-web.webp', v.web)
    await storage.put(key + '-thumb.webp', v.thumb)
    await db.insert(schema.itemImage).values({ itemId: it!.id, fileKey: key, width: v.width, height: v.height, isPrimary: true, sort: 0 })
    created.push(it!.id)
  }
  return { created }
})
