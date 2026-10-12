import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'editor')
  const c = await getOrCreateCollection(user.id)
  const id = getRouterParam(event, 'id')!
  const b = await readBody<{ read?: boolean }>(event)
  const [row] = await db.update(schema.inquiry).set({ readAt: b?.read === false ? null : new Date() }).where(and(eq(schema.inquiry.id, id), eq(schema.inquiry.collectionId, c.id))).returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Anfrage nicht gefunden' })
  return row
})
