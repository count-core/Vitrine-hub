import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const id = getRouterParam(event, 'id')!
  await db.delete(schema.album).where(and(eq(schema.album.id, id), eq(schema.album.collectionId, c.id)))
  return { ok: true }
})
