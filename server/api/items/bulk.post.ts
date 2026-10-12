import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'editor')
  const c = await getOrCreateCollection(user.id)
  const body = await readBody<{ ids: string[], patch?: Record<string, unknown>, albumNumber?: number, delete?: boolean }>(event)
  if (!body?.ids?.length) throw createError({ statusCode: 400, statusMessage: 'Keine Positionen gewählt' })
  const where = and(inArray(schema.item.collectionId, await accessibleCollectionIds(user.id, 'editor')), inArray(schema.item.id, body.ids))
  if (body.delete) {
    const rows = await db.delete(schema.item).where(where).returning({ id: schema.item.id })
    return { deleted: rows.length }
  }
  const patch = pickItemPatch(body.patch || {})
  await assertOwnAlbum(patch, c.id)
  if (body.albumNumber) patch.albumId = (await getOrCreateAlbum(c.id, Number(body.albumNumber))).id
  const rows = await db.update(schema.item).set(patch as any).where(where).returning({ id: schema.item.id })
  return { updated: rows.length }
})
