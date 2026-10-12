import { db, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'editor')
  const id = getRouterParam(event, 'id')!
  const it = await requireOwnedItem(id, user.id, 'editor')
  const { collection } = await resolveCollection(user.id)
  const ai = resolveAiSettings(collection)
  if (!isConfigured(ai)) throw createError({ statusCode: 400, statusMessage: 'KI-Schätzung braucht einen konfigurierten KI-Anbieter (Einstellungen)' })
  const result = await estimateWithAi(ai, it)
  const est = result.estimate
  const cond = it.condition === 'used' ? est.katalogwert_gestempelt_eur : est.katalogwert_postfrisch_eur
  const [row] = await db.insert(schema.priceObservation).values({
    itemId: id, ownerId: user.id, kind: 'ai_estimate', source: `KI-Schätzung (${result.model})${result.sources.length ? ' mit Quellen' : ' ohne Quellen'}`,
    price: est.marktwert_min_eur != null ? Number(est.marktwert_min_eur).toFixed(2) : null,
    priceMax: est.marktwert_max_eur != null ? Number(est.marktwert_max_eur).toFixed(2) : null,
    condition: it.condition, note: [est.begruendung, est.hinweise, cond != null ? `Katalogwert lt. KI: ${cond} €` : ''].filter(Boolean).join(' · ').slice(0, 1000),
    url: result.sources[0]?.url || '', confidence: String(Math.max(0, Math.min(1, est.konfidenz)).toFixed(3)),
    aiRaw: { estimate: est, sources: result.sources, model: result.model },
  }).returning()
  return { row, estimate: est, sources: result.sources, model: result.model }
})
