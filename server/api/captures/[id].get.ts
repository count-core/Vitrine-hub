import { and, asc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

/** Aufnahme (Blattfoto) mit allen daraus entstandenen Positionen. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const cap = await db.query.capture.findFirst({ where: and(eq(schema.capture.id, id), inArray(schema.capture.collectionId, await accessibleCollectionIds(user.id))) })
  if (!cap) throw createError({ statusCode: 404, statusMessage: 'Aufnahme nicht gefunden' })
  const items = await db.query.item.findMany({
    where: eq(schema.item.captureId, id), orderBy: asc(schema.item.position),
    columns: { id: true, position: true, box: true, type: true, area: true, year: true, michelNo: true, faceValue: true, motif: true, condition: true, grade: true, quantity: true, sheet: true, series: true },
    with: { images: { limit: 1, orderBy: (im, { desc }) => [desc(im.isPrimary)] }, album: { columns: { number: true, name: true } } },
  })
  return { capture: { id: cap.id, fileKey: cap.fileKey, width: cap.width, height: cap.height, provider: cap.provider, model: cap.model, createdAt: cap.createdAt }, items }
})
