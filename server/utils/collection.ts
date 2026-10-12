import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../db'
import type { Role } from './access'

/** Rückwärtskompatibel: liefert die aktive Sammlung (eigene oder per Mitgliedschaft). */
export async function getOrCreateCollection(userId: string) {
  return (await resolveCollection(userId)).collection
}

export async function getOrCreateAlbum(collectionId: string, number: number, name = '') {
  const existing = await db.query.album.findFirst({ where: and(eq(schema.album.collectionId, collectionId), eq(schema.album.number, number)) })
  if (existing) return existing
  // Ohne eigenen Namen bleibt das Feld leer, die Oberfläche zeigt dann nur "Album <Nummer>"
  const [created] = await db.insert(schema.album).values({ collectionId, number, name: name.trim() }).returning()
  return created!
}

export async function assertOwnAlbum(patch: Record<string, unknown>, collectionId: string) {
  if (!patch.albumId) return
  const a = await db.query.album.findFirst({ where: and(eq(schema.album.id, String(patch.albumId)), eq(schema.album.collectionId, collectionId)) })
  if (!a) throw createError({ statusCode: 400, statusMessage: 'Album ungültig' })
}

/** Position, auf die der Nutzer mindestens mit der Rolle `min` Zugriff hat (eigene Sammlung oder Mitgliedschaft). */
export async function requireOwnedItem(itemId: string, userId: string, min: Role = 'viewer') {
  const cids = await accessibleCollectionIds(userId, min)
  const it = cids.length ? await db.query.item.findFirst({ where: and(eq(schema.item.id, itemId), inArray(schema.item.collectionId, cids)) }) : null
  if (!it) throw createError({ statusCode: 404, statusMessage: 'Position nicht gefunden' })
  return it
}
