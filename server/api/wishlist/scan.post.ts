import { inArray } from 'drizzle-orm'
import { db, schema } from '../../db'

/**
 * Foto auf der Börse prüfen: erkennt Stücke und sagt je Stück, ob es schon im Bestand ist,
 * auf der Wunschliste steht oder neu wäre. Speichert nichts.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { collection } = await resolveCollection(user.id)
  const parts = await readMultipartFormData(event)
  const file = (parts || []).find(p => p.name === 'file' && p.data?.length)
  const modeRaw = (parts || []).find(p => p.name === 'mode')?.data?.toString('utf8') || 'auto'
  const hint = (parts || []).find(p => p.name === 'hint')?.data?.toString('utf8') || ''
  const mode = (['auto', 'stamps', 'coins'].includes(modeRaw) ? modeRaw : 'auto') as 'auto' | 'stamps' | 'coins'
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Kein Foto' })
  if (file.data.length > MAX_UPLOAD_BYTES) throw createError({ statusCode: 413, statusMessage: 'Foto zu groß (max. 15 MB)' })

  const ai = resolveAiSettings(collection)
  if (!isConfigured(ai)) throw createError({ statusCode: 400, statusMessage: 'Kein KI-Anbieter eingerichtet (Einstellungen)' })
  const orig = await prepareOriginal(file.data)
  const analysis = await analyzeImage(await toBase64Jpeg(orig.buffer), hint || undefined, ai, mode)

  const cids = await accessibleCollectionIds(user.id)
  const pool = await db.query.item.findMany({
    where: inArray(schema.item.collectionId, cids),
    columns: { id: true, area: true, year: true, michelNo: true, motif: true, faceValue: true, type: true, quantity: true, status: true },
    limit: 5000,
  })

  const results = analysis.stamps.map((s, i) => ({
    position: i + 1, box: s.box, type: s.type, area: s.area, year: s.year, michelNo: s.michelNo,
    faceValue: s.faceValue, motif: s.motif, condition: s.condition, series: s.series, confidence: s.confidence,
    ...verdictFor(s, pool),
  }))
  return {
    model: analysis.model, provider: analysis.provider, durationMs: analysis.durationMs,
    width: orig.width, height: orig.height,
    preview: `data:image/jpeg;base64,${(await toBase64Jpeg(orig.buffer, 900))}`,
    results,
    summary: {
      total: results.length,
      owned: results.filter(r => r.verdict === 'owned').length,
      wanted: results.filter(r => r.verdict === 'wanted').length,
      new: results.filter(r => r.verdict === 'new').length,
    },
  }
})
