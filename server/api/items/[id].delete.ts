import { eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  await requireOwnedItem(id, user.id)
  const imgs = await db.query.itemImage.findMany({ where: eq(schema.itemImage.itemId, id) })
  await db.delete(schema.item).where(eq(schema.item.id, id))
  for (const im of imgs) { await storage.delete(im.fileKey + '-web.webp'); await storage.delete(im.fileKey + '-thumb.webp') }
  return { ok: true }
})
