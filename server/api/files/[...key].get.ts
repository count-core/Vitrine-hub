import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

/** Private Dateien: nur der Eigentümer der Position bzw. Aufnahme darf lesen. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const key = getRouterParam(event, 'key')!
  const fileKey = key.replace(/-(web|thumb)\.webp$/, '')
  const cids = await accessibleCollectionIds(user.id)
  let allowed = false
  if (key.startsWith('items/')) {
    const img = await db.query.itemImage.findFirst({ where: eq(schema.itemImage.fileKey, fileKey), with: { item: { columns: { collectionId: true } } } })
    allowed = !!img && cids.includes(img.item.collectionId)
  } else if (key.startsWith('captures/')) {
    const cap = await db.query.capture.findFirst({ where: and(eq(schema.capture.fileKey, key), inArray(schema.capture.collectionId, cids)), columns: { id: true } })
    allowed = !!cap
  }
  if (!allowed) throw createError({ statusCode: 404, statusMessage: 'Datei nicht gefunden' })
  const p = storage.path(key)
  try { await stat(p) } catch { throw createError({ statusCode: 404, statusMessage: 'Datei nicht gefunden' }) }
  setHeader(event, 'Content-Type', key.endsWith('.webp') ? 'image/webp' : 'image/jpeg')
  setHeader(event, 'Cache-Control', 'private, max-age=31536000, immutable')
  return sendStream(event, createReadStream(p))
})
