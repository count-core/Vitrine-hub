import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { db, schema } from '../../../db'

/** Liefert Bilder nur für Positionen aus öffentlichen Sammlungen. */
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')!
  const fileKey = key.replace(/-(web|thumb)\.webp$/, '')
  const img = await db.query.itemImage.findFirst({ where: eq(schema.itemImage.fileKey, fileKey), with: { item: { with: { collection: true } } } })
  if (!img || img.item.visibility === 'hidden' || img.item.collection.visibility === 'private') throw createError({ statusCode: 404, statusMessage: 'Nicht gefunden' })
  const p = storage.path(key)
  try { await stat(p) } catch { throw createError({ statusCode: 404, statusMessage: 'Datei nicht gefunden' }) }
  setHeader(event, 'Content-Type', 'image/webp'); setHeader(event, 'Cache-Control', 'public, max-age=900, stale-while-revalidate=60')
  return sendStream(event, createReadStream(p))
})
