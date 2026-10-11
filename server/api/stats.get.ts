import { count, desc, eq, sql, sum } from 'drizzle-orm'
import { db, schema } from '../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const where = eq(schema.item.collectionId, c.id)
  const [tot] = await db.select({
    positions: count(),
    pieces: sql<number>`coalesce(sum(${schema.item.quantity}),0)::int`,
    catalogValue: sql<string>`coalesce(sum(${schema.item.catalogValue} * ${schema.item.quantity}),0)`,
    areas: sql<number>`count(distinct nullif(${schema.item.area},''))::int`,
    duplicates: sql<number>`count(*) filter (where ${schema.item.status} = 'duplicate' or ${schema.item.quantity} > 1)::int`,
    withoutImage: sql<number>`count(*) filter (where not exists (select 1 from item_image i where i.item_id = item.id))::int`,
  }).from(schema.item).where(where)
  const byArea = await db.select({ area: schema.item.area, n: count() }).from(schema.item).where(where).groupBy(schema.item.area).orderBy(desc(count()))
  const recent = await db.query.item.findMany({ where, orderBy: desc(schema.item.createdAt), limit: 6, with: { images: { limit: 1, orderBy: (i, { desc }) => [desc(i.isPrimary), i.sort] } } })
  return { ...tot, catalogValue: Number(tot?.catalogValue ?? 0), byArea, recent }
})
