import { count } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const q = getQuery(event)
  const filters = { q: q.q as string, area: q.area as string, condition: q.condition as string, status: q.status as string, albumId: q.albumId as string, sheet: q.sheet ? Number(q.sheet) : undefined, type: q.type as string, series: q.series as string, sort: (q.sort as any) || 'michel' }
  const page = Math.max(1, Number(q.page) || 1), limit = Math.min(200, Number(q.limit) || 60)
  const where = buildItemWhere(c.id, filters)
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(schema.item).where(where)
  const rows = await db.query.item.findMany({
    where, orderBy: itemOrder(filters.sort), limit, offset: (page - 1) * limit,
    with: { images: { orderBy: (i, { desc, asc }) => [desc(i.isPrimary), asc(i.sort)], limit: 1 }, album: true },
  })
  return { items: rows, total, page, limit }
})
