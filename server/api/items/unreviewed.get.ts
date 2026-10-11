import { and, asc, count, eq, isNull, sql } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const where = and(eq(schema.item.collectionId, c.id), isNull(schema.item.reviewedAt), sql`${schema.item.status} <> 'wanted'`)
  const [{ total }] = await db.select({ total: count() }).from(schema.item).where(where)
  const [{ reviewed }] = await db.select({ reviewed: count() }).from(schema.item).where(and(eq(schema.item.collectionId, c.id), sql`${schema.item.reviewedAt} is not null`))
  const items = await db.query.item.findMany({ where, orderBy: [asc(schema.item.area), asc(schema.item.year), asc(schema.item.createdAt)], limit: 25, with: { images: { limit: 2, orderBy: (i, { desc }) => [desc(i.isPrimary)] }, album: true } })
  return { items, total, reviewed }
})
