import { aiProvider } from '#shared/utils/aiProviders'

/** Aktuelle KI-Konfiguration der Sammlung, Schlüssel nur maskiert. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { collection, role } = await resolveCollection(user.id)
  const env = aiSettingsFromConfig()
  const active = resolveAiSettings(collection)
  const key = collection.aiApiKeyEnc ? decryptSecret(collection.aiApiKeyEnc) : ''
  return {
    role,
    saved: { provider: collection.aiProvider || '', model: collection.aiModel || '', baseUrl: collection.aiBaseUrl || '', hasKey: !!key, keyHint: maskSecret(key) },
    active: { provider: active.provider, label: aiProvider(active.provider)?.label || active.provider, model: active.model, source: active.source, configured: isConfigured(active) },
    server: { provider: env.provider, label: aiProvider(env.provider)?.label || env.provider, model: env.model, configured: isConfigured(env) },
  }
})
