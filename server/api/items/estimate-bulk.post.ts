import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

/** KI-Schätzung für bis zu 15 Positionen nacheinander (Rate-Limit des Free Tiers schonen). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ ids: string[] }>(event)
  const ids = (body?.ids || []).slice(0, 15)
  if (!ids.length) throw createError({ statusCode: 400, statusMessage: 'Keine Positionen gewählt' })
  const { collection } = await resolveCollection(user.id)
  const ai = resolveAiSettings(collection)
  if (!isConfigured(ai)) throw createError({ statusCode: 400, statusMessage: 'KI-Schätzung braucht einen konfigurierten KI-Anbieter (Einstellungen)' })
  const items = await db.query.item.findMany({ where: and(inArray(schema.item.collectionId, await accessibleCollectionIds(user.id)), inArray(schema.item.id, ids)) })
  const results: { id: string, ok: boolean, error?: string }[] = []
  for (const it of items) {
    try {
      const r = await estimateWithAi({ ...ai, grounding: false }, it)
      const est = r.estimate
      await db.insert(schema.priceObservation).values({ itemId: it.id, ownerId: user.id, kind: 'ai_estimate', source: `KI-Schätzung (${r.model}) ohne Quellen`, price: est.marktwert_min_eur != null ? Number(est.marktwert_min_eur).toFixed(2) : null, priceMax: est.marktwert_max_eur != null ? Number(est.marktwert_max_eur).toFixed(2) : null, condition: it.condition, note: [est.begruendung, est.hinweise].filter(Boolean).join(' · ').slice(0, 1000), confidence: String(Math.max(0, Math.min(1, est.konfidenz)).toFixed(3)), aiRaw: { estimate: est, model: r.model } })
      results.push({ id: it.id, ok: true })
    } catch (e: any) {
      results.push({ id: it.id, ok: false, error: e?.message })
      if (/429/.test(e?.message || '')) break
    }
  }
  return { results, done: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length }
})
