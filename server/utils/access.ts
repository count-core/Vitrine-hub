import { and, eq, inArray } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { db, schema } from '../db'

export type Role = 'owner' | 'editor' | 'viewer'

/** Aktive Sammlung eines Nutzers: eigene Sammlung, sonst Mitgliedschaft, sonst neu anlegen. */
export async function resolveCollection(userId: string): Promise<{ collection: typeof schema.collection.$inferSelect, role: Role }> {
  const own = await db.query.collection.findFirst({ where: eq(schema.collection.ownerId, userId) })
  if (own) return { collection: own, role: 'owner' }
  const m = await db.query.collectionMember.findFirst({ where: eq(schema.collectionMember.userId, userId), with: { collection: true } })
  if (m) return { collection: m.collection, role: m.role }
  const [created] = await db.insert(schema.collection).values({ ownerId: userId, name: 'Meine Sammlung' }).returning()
  return { collection: created!, role: 'owner' }
}

const rank: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 }

/** IDs aller Sammlungen, auf die der Nutzer mindestens mit der Rolle `min` Zugriff hat. */
export async function accessibleCollectionIds(userId: string, min: Role = 'viewer') {
  const own = await db.select({ id: schema.collection.id }).from(schema.collection).where(eq(schema.collection.ownerId, userId))
  const mem = min === 'owner' ? [] : await db.select({ id: schema.collectionMember.collectionId, role: schema.collectionMember.role }).from(schema.collectionMember).where(eq(schema.collectionMember.userId, userId))
  return [...new Set([...own.map(o => o.id), ...mem.filter(m => rank[m.role] >= rank[min]).map(m => m.id)])]
}

export async function requireRole(event: H3Event, min: Role) {
  const user = await requireUser(event)
  const { collection, role } = await resolveCollection(user.id)
  if (rank[role] < rank[min]) throw createError({ statusCode: 403, statusMessage: min === 'owner' ? 'Nur der Eigentümer darf das' : 'Nur mit Bearbeiten-Recht möglich' })
  return { user, collection, role }
}
export { inArray }
