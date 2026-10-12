import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'editor')
  const c = await getOrCreateCollection(user.id)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string, number?: number }>(event)
  const patch: any = {}
  if (body?.name != null) patch.name = body.name
  if (body?.number) patch.number = Number(body.number)
  const [row] = await db.update(schema.album).set(patch).where(and(eq(schema.album.id, id), eq(schema.album.collectionId, c.id))).returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Album nicht gefunden' })
  return row
})
