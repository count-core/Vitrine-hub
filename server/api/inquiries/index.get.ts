import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const rows = await db.query.inquiry.findMany({ where: eq(schema.inquiry.collectionId, c.id), orderBy: desc(schema.inquiry.createdAt), limit: 200, with: { item: { columns: { id: true, michelNo: true, motif: true, area: true, year: true } } } })
  return { rows, unread: rows.filter(r => !r.readAt).length }
})
