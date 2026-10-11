import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'
import { schema } from '../db'

export interface ItemFilters {
  q?: string
  area?: string
  condition?: string
  status?: string
  albumId?: string
  sheet?: number
  sort?: 'michel' | 'newest' | 'year' | 'value'
  type?: string
  series?: string
}

export function buildItemWhere(collectionId: string, f: ItemFilters): SQL {
  const parts: SQL[] = [eq(schema.item.collectionId, collectionId)]
  const q = (f.q || '').trim().toLowerCase().slice(0, 100)
  if (q) {
    const esc = q.replace(/[\\%_]/g, m => '\\' + m)
    parts.push(or(
      ilike(schema.item.searchText, `%${esc}%`),
      sql`word_similarity(${q}, ${schema.item.searchText}) > 0.45`,
    )!)
  }
  if (f.area) parts.push(eq(schema.item.area, f.area))
  if (f.type) parts.push(f.type === 'coins' ? inArray(schema.item.type, ['coin', 'coin_set', 'banknote']) : f.type === 'stamps' ? inArray(schema.item.type, ['stamp', 'block', 'booklet', 'stamp_set', 'cover']) : eq(schema.item.type, f.type as any))
  if (f.series) parts.push(eq(schema.item.series, f.series))
  if (f.condition) parts.push(eq(schema.item.condition, f.condition as any))
  if (f.status) parts.push(eq(schema.item.status, f.status as any))
  if (f.albumId) parts.push(eq(schema.item.albumId, f.albumId))
  if (f.sheet) parts.push(eq(schema.item.sheet, f.sheet))
  return and(...parts)!
}

export function itemOrder(sort: ItemFilters['sort']) {
  switch (sort) {
    case 'newest': return [desc(schema.item.createdAt)]
    case 'year': return [asc(schema.item.year), asc(schema.item.michelNo)]
    case 'value': return [desc(schema.item.catalogValue)]
    default: return [asc(schema.item.area), sql`nullif(regexp_replace(${schema.item.michelNo}, '\\D', '', 'g'), '')::int asc nulls last`, asc(schema.item.michelNo)]
  }
}

export const ITEM_PATCH_FIELDS = ['albumId', 'sheet', 'position', 'type', 'area', 'country', 'year', 'michelNo', 'faceValue', 'motif', 'color', 'condition', 'quantity', 'status', 'publicNote', 'visibility', 'catalogValue', 'estValue', 'privateNote', 'wantedMaxPrice', 'series', 'grade', 'material', 'mint', 'diameterMm', 'weightG'] as const

export function pickItemPatch(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of ITEM_PATCH_FIELDS) {
    if (!(k in body)) continue
    let v = body[k]
    if (['year', 'sheet', 'position', 'quantity'].includes(k)) v = v === '' || v == null ? null : Number(v)
    if (['catalogValue', 'estValue', 'wantedMaxPrice', 'diameterMm', 'weightG'].includes(k)) v = v === '' || v == null ? null : String(v).replace(',', '.')
    if (k === 'quantity' && (v == null || Number(v) < 1)) v = 1
    if (k === 'albumId' && v === '') v = null
    out[k] = v
  }
  out.updatedAt = new Date()
  return out
}

export { inArray }
