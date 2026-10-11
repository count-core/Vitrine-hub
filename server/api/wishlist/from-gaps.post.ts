import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

/** Legt ausgewählte fehlende Nummern als Wünsche an. */
export default defineEventHandler(async (event) => {
  const { user, collection } = await requireRole(event, 'editor')
  const b = await readBody<{ entries?: { area?: string, type?: string, series?: string, michelNo?: string | number, year?: number | null, condition?: string, motif?: string }[] }>(event)
  const entries = (b?.entries || []).slice(0, 200)
  if (!entries.length) throw createError({ statusCode: 400, statusMessage: 'Nichts ausgewählt' })
  const types = ['stamp', 'block', 'booklet', 'cover', 'coin', 'coin_set', 'stamp_set', 'banknote']
  const conds = ['mnh', 'hinged', 'no_gum', 'used', 'unknown']
  const rows = entries.map(e => ({
    collectionId: collection.id, ownerId: user.id, status: 'wanted' as const, quantity: 1,
    type: (types.includes(String(e.type)) ? e.type : 'stamp') as typeof schema.item.$inferInsert['type'],
    area: String(e.area || '').slice(0, 120),
    michelNo: String(e.michelNo ?? '').slice(0, 40),
    series: String(e.series || '').slice(0, 160),
    motif: String(e.motif || '').slice(0, 300),
    year: Number.isFinite(Number(e.year)) && Number(e.year) > 1800 ? Number(e.year) : null,
    condition: (conds.includes(String(e.condition)) ? e.condition : 'unknown') as typeof schema.item.$inferInsert['condition'],
  })).filter(r => r.michelNo || r.motif)
  if (!rows.length) throw createError({ statusCode: 400, statusMessage: 'Keine gültigen Einträge' })
  // Schon vorhandene Wünsche überspringen
  const existing = await db.query.item.findMany({
    where: and(eq(schema.item.collectionId, collection.id), eq(schema.item.status, 'wanted'), inArray(schema.item.michelNo, rows.map(r => r.michelNo).filter(Boolean))),
    columns: { area: true, michelNo: true, type: true },
  })
  const have = new Set(existing.map(e => `${e.area}|${e.type}|${e.michelNo}`))
  const fresh = rows.filter(r => !have.has(`${r.area}|${r.type}|${r.michelNo}`))
  if (!fresh.length) return { added: 0, skipped: rows.length }
  await db.insert(schema.item).values(fresh)
  return { added: fresh.length, skipped: rows.length - fresh.length }
})
