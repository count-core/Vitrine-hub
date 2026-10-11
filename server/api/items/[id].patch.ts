import { eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  await requireOwnedItem(id, user.id)
  const body = await readBody(event)
  const patch = pickItemPatch(body || {})
  const c = await getOrCreateCollection(user.id)
  await assertOwnAlbum(patch, c.id)
  if (body?.albumNumber) patch.albumId = (await getOrCreateAlbum(c.id, Number(body.albumNumber))).id
  const [updated] = await db.update(schema.item).set(patch as any).where(eq(schema.item.id, id)).returning()
  return updated
})
