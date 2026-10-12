import { eq } from 'drizzle-orm'
import { db, schema } from '../../../db'

/** Wisch-Entscheidung: behalten, Dublette oder verkaufen; merkt sich, dass die Position gesichtet wurde. */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'editor')
  const id = getRouterParam(event, 'id')!
  await requireOwnedItem(id, user.id, 'editor')
  const b = await readBody<{ decision: 'keep' | 'duplicate' | 'sell' | 'undo' }>(event)
  const status = b?.decision === 'duplicate' ? 'duplicate' : b?.decision === 'sell' ? 'for_sale' : b?.decision === 'keep' ? 'collection' : null
  const [row] = await db.update(schema.item).set(b?.decision === 'undo' ? { reviewedAt: null } : { status: status as any, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(schema.item.id, id)).returning()
  return row
})
