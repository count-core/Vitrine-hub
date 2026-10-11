import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  await db.delete(schema.invite).where(and(eq(schema.invite.id, getRouterParam(event, 'id')!), eq(schema.invite.collectionId, collection.id)))
  return { ok: true }
})
