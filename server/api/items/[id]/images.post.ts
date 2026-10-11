import { eq } from 'drizzle-orm'
import { db, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  await requireOwnedItem(id, user.id)
  const parts = await readMultipartFormData(event)
  const files = (parts || []).filter(p => p.name === 'file' && p.data?.length)
  if (!files.length) throw createError({ statusCode: 400, statusMessage: 'Keine Datei' })
  if (files.length > 10) throw createError({ statusCode: 400, statusMessage: 'Höchstens 10 Dateien auf einmal' })
  const existing = await db.query.itemImage.findMany({ where: eq(schema.itemImage.itemId, id) })
  const created = []
  for (const [i, f] of files.entries()) {
    if (f.data.length > MAX_UPLOAD_BYTES) throw createError({ statusCode: 413, statusMessage: 'Datei zu groß (max. 15 MB)' })
    const orig = await prepareOriginal(f.data)
    const v = await makeVariants(orig.buffer)
    const key = `items/${id}/${crypto.randomUUID()}`
    await storage.put(key + '-web.webp', v.web)
    await storage.put(key + '-thumb.webp', v.thumb)
    const [row] = await db.insert(schema.itemImage).values({ itemId: id, fileKey: key, width: v.width, height: v.height, isPrimary: existing.length === 0 && i === 0, sort: existing.length + i }).returning()
    created.push(row)
  }
  return created
})
