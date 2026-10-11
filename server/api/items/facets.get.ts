import { and, count, desc, eq, ne } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const where = eq(schema.item.collectionId, c.id)
  const [areas, conditions, statuses, albums, types, series] = await Promise.all([
    db.select({ value: schema.item.area, n: count() }).from(schema.item).where(where).groupBy(schema.item.area).orderBy(desc(count())),
    db.select({ value: schema.item.condition, n: count() }).from(schema.item).where(where).groupBy(schema.item.condition),
    db.select({ value: schema.item.status, n: count() }).from(schema.item).where(where).groupBy(schema.item.status),
    db.select({ id: schema.album.id, number: schema.album.number, name: schema.album.name }).from(schema.album).where(eq(schema.album.collectionId, c.id)).orderBy(schema.album.number),
    db.select({ value: schema.item.type, n: count() }).from(schema.item).where(where).groupBy(schema.item.type),
    db.select({ value: schema.item.series, n: count() }).from(schema.item).where(and(where, ne(schema.item.series, ''))).groupBy(schema.item.series).orderBy(desc(count())).limit(200),
  ])
  return { areas: areas.filter(a => a.value), conditions, statuses, albums, types, series }
})
