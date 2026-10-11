import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  const b = await readBody<{ role: string }>(event)
  if (!['editor', 'viewer'].includes(b?.role)) throw createError({ statusCode: 400, statusMessage: 'Rolle ungültig' })
  const [row] = await db.update(schema.collectionMember).set({ role: b.role as any }).where(and(eq(schema.collectionMember.id, getRouterParam(event, 'id')!), eq(schema.collectionMember.collectionId, collection.id))).returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Mitglied nicht gefunden' })
  return row
})
