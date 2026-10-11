import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const c = await getOrCreateCollection(user.id)
  const body = await readBody(event)
  const patch = pickItemPatch(body || {})
  await assertOwnAlbum(patch, c.id)
  if (body?.albumNumber) patch.albumId = (await getOrCreateAlbum(c.id, Number(body.albumNumber))).id
  const [created] = await db.insert(schema.item).values({ ...(patch as any), collectionId: c.id, ownerId: c.ownerId }).returning()
  return created
})
