import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'editor')
  const id = getRouterParam(event, 'id')!
  const row = await db.query.priceObservation.findFirst({ where: eq(schema.priceObservation.id, id), with: { item: { columns: { collectionId: true } } } })
  if (!row || !(await accessibleCollectionIds(user.id, 'editor')).includes(row.item.collectionId)) throw createError({ statusCode: 404, statusMessage: 'Eintrag nicht gefunden' })
  const rows = await db.delete(schema.priceObservation).where(eq(schema.priceObservation.id, id)).returning({ id: schema.priceObservation.id })
  if (!rows.length) throw createError({ statusCode: 404, statusMessage: 'Eintrag nicht gefunden' })
  return { ok: true }
})
