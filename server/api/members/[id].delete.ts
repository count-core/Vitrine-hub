import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  await db.delete(schema.collectionMember).where(and(eq(schema.collectionMember.id, getRouterParam(event, 'id')!), eq(schema.collectionMember.collectionId, collection.id)))
  return { ok: true }
})
