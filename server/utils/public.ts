import { and, eq, inArray, ne } from 'drizzle-orm'
import { db, schema } from '../db'

export const PUBLIC_STATUSES = ['collection', 'duplicate', 'for_sale', 'sold'] as const

export function slugify(s: string) {
  return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

export async function findPublicCollection(slug: string) {
  const c = await db.query.collection.findFirst({ where: eq(schema.collection.slug, slug) })
  if (!c || c.visibility === 'private') return null
  return c
}

/** Öffentliche Sicht auf eine Position: nur unkritische Felder. */
export function toPublicItem(it: any) {
  return {
    id: it.id, type: it.type, area: it.area, country: it.country, year: it.year, michelNo: it.michelNo, faceValue: it.faceValue, motif: it.motif, color: it.color,
    condition: it.condition, quantity: it.quantity, status: it.status, publicNote: it.publicNote, wantedMaxPrice: it.status === 'wanted' ? it.wantedMaxPrice : null,
    image: it.images?.[0]?.fileKey ?? null,
  }
}

export async function publicItems(collectionId: string, wanted = false) {
  const rows = await db.query.item.findMany({
    where: and(eq(schema.item.collectionId, collectionId), ne(schema.item.visibility, 'hidden'), wanted ? eq(schema.item.status, 'wanted') : inArray(schema.item.status, [...PUBLIC_STATUSES])),
    orderBy: (i, { asc }) => [asc(i.area), asc(i.year), asc(i.michelNo)],
    with: { images: { orderBy: (im, { desc }) => [desc(im.isPrimary)], limit: 1 } },
  })
  return rows.map(toPublicItem)
}
