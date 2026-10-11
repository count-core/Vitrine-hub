import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  await db.delete(schema.inquiry).where(and(eq(schema.inquiry.id, getRouterParam(event, 'id')!), eq(schema.inquiry.collectionId, c.id)))
  return { ok: true }
})
