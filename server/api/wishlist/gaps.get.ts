import { and, eq, inArray, ne } from 'drizzle-orm'
import { db, schema } from '../../db'
import { findGaps } from '../../utils/gaps'

/** Fehlende Katalognummern im eigenen Bestand, gruppiert nach Gebiet, Typ und Serie. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const q = getQuery(event)
  const num = (v: unknown, d: number, max: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(n, max) : d }
  const cids = await accessibleCollectionIds(user.id)
  const rows = await db.query.item.findMany({
    where: and(inArray(schema.item.collectionId, cids), ne(schema.item.status, 'wanted'), ne(schema.item.status, 'sold')),
    columns: { area: true, year: true, michelNo: true, type: true, series: true, condition: true },
    limit: 5000,
  })
  const groups = findGaps(rows, {
    minHave: num(q.minHave, 3, 20),
    maxRun: num(q.maxRun, 10, 50),
    bySeries: q.bySeries !== 'false',
  })
  // Nummern, die schon auf der Wunschliste stehen, nicht noch einmal vorschlagen
  const wanted = await db.query.item.findMany({
    where: and(inArray(schema.item.collectionId, cids), eq(schema.item.status, 'wanted')),
    columns: { area: true, michelNo: true, type: true },
  })
  const onList = new Set(wanted.map(w => `${w.area}|${w.type}|${String(w.michelNo).trim()}`))
  const cleaned = groups
    .map(g => ({ ...g, missing: g.missing.filter(n => !onList.has(`${g.area}|${g.type}|${n}`)) }))
    .filter(g => g.missing.length)
  return { groups: cleaned, total: cleaned.reduce((a, g) => a + g.missing.length, 0), checked: rows.length }
})
