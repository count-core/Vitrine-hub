import { asc, count, eq, sql } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const rows = await db.select({
    id: schema.album.id, number: schema.album.number, name: schema.album.name,
    items: sql<number>`(select count(*) from ${schema.item} i where i.album_id = ${schema.album.id})::int`,
    sheets: sql<number[]>`(select coalesce(array_agg(distinct i.sheet order by i.sheet), '{}') from ${schema.item} i where i.album_id = ${schema.album.id} and i.sheet is not null)`,
  }).from(schema.album).where(eq(schema.album.collectionId, c.id)).orderBy(asc(schema.album.number))
  return rows
})
