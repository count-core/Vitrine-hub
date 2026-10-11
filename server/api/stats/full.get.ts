import { count, desc, eq, sql } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const where = eq(schema.item.collectionId, c.id)
  const i = schema.item
  const [totals] = await db.select({
    positions: count(),
    pieces: sql<number>`coalesce(sum(${i.quantity}),0)::int`,
    catalogValue: sql<number>`coalesce(sum(${i.catalogValue} * ${i.quantity}),0)::float`,
    estValue: sql<number>`coalesce(sum(${i.estValue} * ${i.quantity}),0)::float`,
    withCatalog: sql<number>`count(*) filter (where ${i.catalogValue} is not null)::int`,
    withEst: sql<number>`count(*) filter (where ${i.estValue} is not null)::int`,
    withMichel: sql<number>`count(*) filter (where ${i.michelNo} <> '')::int`,
    withImage: sql<number>`count(*) filter (where exists (select 1 from item_image im where im.item_id = item.id))::int`,
    avgConfidence: sql<number>`coalesce(avg(${i.aiConfidence}),0)::float`,
    last7: sql<number>`count(*) filter (where ${i.createdAt} > now() - interval '7 days')::int`,
    last30: sql<number>`count(*) filter (where ${i.createdAt} > now() - interval '30 days')::int`,
    areas: sql<number>`count(distinct nullif(${i.area},''))::int`,
    minYear: sql<number | null>`min(${i.year})`, maxYear: sql<number | null>`max(${i.year})`,
  }).from(i).where(where)
  const byArea = await db.select({ key: i.area, positions: count(), pieces: sql<number>`sum(${i.quantity})::int`, value: sql<number>`coalesce(sum(${i.catalogValue} * ${i.quantity}),0)::float` }).from(i).where(where).groupBy(i.area).orderBy(desc(count()))
  const byCondition = await db.select({ key: i.condition, positions: count(), pieces: sql<number>`sum(${i.quantity})::int` }).from(i).where(where).groupBy(i.condition)
  const byStatus = await db.select({ key: i.status, positions: count() }).from(i).where(where).groupBy(i.status)
  const byDecade = await db.select({ key: sql<number>`(floor(${i.year} / 10) * 10)::int`, positions: count() }).from(i).where(sql`${where} and ${i.year} is not null`).groupBy(sql`floor(${i.year} / 10)`).orderBy(sql`floor(${i.year} / 10)`)
  const timeline = await db.select({ day: sql<string>`to_char(date_trunc('day', ${i.createdAt}), 'YYYY-MM-DD')`, positions: count(), pieces: sql<number>`sum(${i.quantity})::int` }).from(i).where(sql`${where} and ${i.createdAt} > now() - interval '90 days'`).groupBy(sql`date_trunc('day', ${i.createdAt})`).orderBy(sql`date_trunc('day', ${i.createdAt})`)
  const topValue = await db.query.item.findMany({ where: sql`${where} and ${i.catalogValue} is not null`, orderBy: desc(i.catalogValue), limit: 10, with: { images: { limit: 1 } } })
  const albums = await db.select({ number: schema.album.number, name: schema.album.name, positions: sql<number>`count(${i.id})::int`, sheets: sql<number>`count(distinct ${i.sheet})::int` }).from(schema.album).leftJoin(i, eq(i.albumId, schema.album.id)).where(eq(schema.album.collectionId, c.id)).groupBy(schema.album.id).orderBy(schema.album.number)
  const [prices] = await db.select({
    observations: sql<number>`count(*) filter (where kind in ('observed','sold'))::int`,
    estimates: sql<number>`count(*) filter (where kind = 'ai_estimate')::int`,
    itemsWithPrices: sql<number>`count(distinct item_id)::int`,
    estimateSum: sql<number>`coalesce(sum(case when kind = 'ai_estimate' then (coalesce(price,0) + coalesce(price_max, price, 0)) / 2 end),0)::float`,
  }).from(schema.priceObservation).innerJoin(schema.item, eq(schema.item.id, schema.priceObservation.itemId)).where(eq(schema.item.collectionId, c.id))
  return { totals, byArea, byCondition, byStatus, byDecade, timeline, topValue, albums, prices }
})
