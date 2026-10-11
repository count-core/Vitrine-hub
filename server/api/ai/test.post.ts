import { aiProvider } from '#shared/utils/aiProviders'

/** Probeanfrage mit den (noch ungespeicherten) Einstellungen. Leerer Schlüssel = gespeicherten Schlüssel nehmen. */
export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  const b = await readBody<{ provider?: string, model?: string, apiKey?: string, baseUrl?: string }>(event) || {}
  const info = aiProvider(b.provider)
  if (!info) throw createError({ statusCode: 400, statusMessage: 'Unbekannter Anbieter' })
  const apiKey = b.apiKey?.trim() || (collection.aiProvider === info.id && collection.aiApiKeyEnc ? decryptSecret(collection.aiApiKeyEnc) : '')
  const baseUrl = info.needsUrl ? await assertSafeBaseUrl(String(b.baseUrl || info.defaultUrl).trim().slice(0, 300)) : ''
  const s = aiSettingsFromFields({ provider: info.id, model: b.model, apiKey, baseUrl })!
  if (info.needsKey && !s.apiKey) return { ok: false, error: 'API-Schlüssel fehlt' }
  const t0 = Date.now()
  try {
    const r = await generateJson(s, { prompt: 'Reply with a JSON object {"ok": true, "model": "<your model name>"}.', schema: { type: 'object', properties: { ok: { type: 'boolean' }, model: { type: 'string' } }, required: ['ok'] }, temperature: 0 })
    return { ok: r.raw?.ok === true || !!r.raw, model: r.model, reported: r.raw?.model || '', ms: Date.now() - t0 }
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).slice(0, 300), ms: Date.now() - t0 }
  }
})
