import { count, desc, eq, sql } from 'drizzle-orm'
import { db, schema } from '../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const i = schema.item
  return db.select({
    series: i.series, positions: count(), pieces: sql<number>`sum(${i.quantity})::int`, area: sql<string>`min(${i.area})`,
    years: sql<string>`concat(min(${i.year}), case when min(${i.year}) <> max(${i.year}) then concat('–', max(${i.year})) else '' end)`,
    types: sql<string>`string_agg(distinct ${i.type}::text, ',')`, value: sql<number>`coalesce(sum(${i.catalogValue} * ${i.quantity}),0)::float`,
    image: sql<string | null>`min((select im.file_key from item_image im where im.item_id = ${i.id} order by im.is_primary desc limit 1))`,
    captureKey: sql<string | null>`min((select cp.file_key from capture cp where cp.id = ${i.captureId}))`,
  }).from(i).where(sql`${eq(i.collectionId, c.id)} and ${i.series} <> ''`).groupBy(i.series).orderBy(desc(count()))
})
