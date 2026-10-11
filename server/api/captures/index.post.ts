import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const parts = await readMultipartFormData(event)
  const file = (parts || []).find(p => p.name === 'file' && p.data?.length)
  const hint = (parts || []).find(p => p.name === 'hint')?.data?.toString('utf8') || ''
  const modeRaw = (parts || []).find(p => p.name === 'mode')?.data?.toString('utf8') || 'auto'
  const mode = (['auto', 'stamps', 'coins'].includes(modeRaw) ? modeRaw : 'auto') as 'auto' | 'stamps' | 'coins'
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Kein Foto' })
  if (file.data.length > MAX_UPLOAD_BYTES) throw createError({ statusCode: 413, statusMessage: 'Foto zu groß (max. 15 MB)' })
  const orig = await prepareOriginal(file.data)
  const id = crypto.randomUUID()
  const fileKey = `captures/${id}.jpg`
  await storage.put(fileKey, orig.buffer)
  let analysis: Awaited<ReturnType<typeof analyzeImage>> | null = null
  let error: string | null = null
  try {
    analysis = await analyzeImage(await toBase64Jpeg(orig.buffer), hint || undefined, resolveAiSettings(c), mode)
  } catch (e: any) {
    error = e?.message || String(e)
  }
  const [row] = await db.insert(schema.capture).values({
    id, collectionId: c.id, ownerId: c.ownerId, fileKey, width: orig.width, height: orig.height,
    provider: analysis?.provider ?? null, model: analysis?.model ?? null, result: analysis?.raw ?? null, error, durationMs: analysis?.durationMs ?? null,
  }).returning()
  return { capture: { id: row!.id, fileKey, width: orig.width, height: orig.height, provider: analysis?.provider, model: analysis?.model, durationMs: analysis?.durationMs, usage: analysis?.usage ?? null }, stamps: analysis?.stamps ?? [], error }
})
