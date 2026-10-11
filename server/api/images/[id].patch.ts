import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const img = await db.query.itemImage.findFirst({ where: eq(schema.itemImage.id, id), with: { item: true } })
  if (!img || !(await accessibleCollectionIds(user.id)).includes(img.item.collectionId)) throw createError({ statusCode: 404, statusMessage: 'Bild nicht gefunden' })
  await db.update(schema.itemImage).set({ isPrimary: false }).where(and(eq(schema.itemImage.itemId, img.itemId)))
  await db.update(schema.itemImage).set({ isPrimary: true }).where(eq(schema.itemImage.id, id))
  return { ok: true }
})
