import { aiProvider } from '#shared/utils/aiProviders'

/** Modellliste vom Anbieter. Leerer Schlüssel = gespeicherten Schlüssel nehmen. */
export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  const q = getQuery(event)
  const info = aiProvider(String(q.provider || ''))
  if (!info) throw createError({ statusCode: 400, statusMessage: 'Unbekannter Anbieter' })
  const apiKey = String(q.apiKey || '').trim() || (collection.aiProvider === info.id && collection.aiApiKeyEnc ? decryptSecret(collection.aiApiKeyEnc) : '')
  const baseUrl = info.needsUrl ? await assertSafeBaseUrl(String(q.baseUrl || info.defaultUrl).trim().slice(0, 300)) : ''
  const s = aiSettingsFromFields({ provider: info.id, apiKey, baseUrl })!
  if (info.needsKey && !s.apiKey) throw createError({ statusCode: 400, statusMessage: 'API-Schlüssel fehlt' })
  try {
    const models = await listModels(s)
    return { models: models.slice(0, 300) }
  } catch (e: any) {
    throw createError({ statusCode: 502, statusMessage: String(e?.message || e).slice(0, 300) })
  }
})
