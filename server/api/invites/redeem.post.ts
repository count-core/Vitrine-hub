import { and, eq, isNull } from 'drizzle-orm'
import { db, schema } from '../../db'

/** Einladungscode nach der Registrierung einlösen: legt die Mitgliedschaft an. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const b = await readBody<{ code: string }>(event)
  const inv = await validInvite(b?.code)
  if (!inv) throw createError({ statusCode: 400, statusMessage: 'Einladung ungültig oder abgelaufen' })
  if (inv.collection.ownerId === user.id) return { ok: true, role: 'owner' }
  // Erst atomar als benutzt markieren: von zwei gleichzeitigen Einlösungen gewinnt nur eine
  const [claimed] = await db.update(schema.invite).set({ usedBy: user.id, usedAt: new Date() }).where(and(eq(schema.invite.id, inv.id), isNull(schema.invite.usedAt))).returning({ id: schema.invite.id })
  if (!claimed) throw createError({ statusCode: 400, statusMessage: 'Einladung ungültig oder abgelaufen' })
  await db.insert(schema.collectionMember).values({ collectionId: inv.collectionId, userId: user.id, role: inv.role }).onConflictDoNothing()
  // Eine leere, automatisch angelegte eigene Sammlung wäre im Weg: nur löschen, wenn sie leer ist
  const own = await db.query.collection.findFirst({ where: eq(schema.collection.ownerId, user.id), with: { items: { limit: 1 } } })
  if (own && !own.items.length) await db.delete(schema.collection).where(eq(schema.collection.id, own.id))
  return { ok: true, role: inv.role }
})
