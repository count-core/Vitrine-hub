import { desc, eq } from 'drizzle-orm'
import { db, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const it = await requireOwnedItem(id, user.id)
  const rows = await db.query.priceObservation.findMany({ where: eq(schema.priceObservation.itemId, id), orderBy: desc(schema.priceObservation.observedAt) })
  return { rows, summary: summarizePrices(rows), links: researchLinks(it) }
})
