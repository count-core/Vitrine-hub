import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const it = await db.query.item.findFirst({
    where: and(eq(schema.item.id, id), inArray(schema.item.collectionId, await accessibleCollectionIds(user.id))),
    with: { images: { orderBy: (i, { desc, asc }) => [desc(i.isPrimary), asc(i.sort)] }, album: true, capture: { columns: { id: true, fileKey: true, provider: true, model: true, createdAt: true } } },
  })
  if (!it) throw createError({ statusCode: 404, statusMessage: 'Position nicht gefunden' })
  return it
})
