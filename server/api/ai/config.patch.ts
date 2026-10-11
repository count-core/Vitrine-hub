import { eq } from 'drizzle-orm'
import { AI_PROVIDER_IDS, aiProvider } from '#shared/utils/aiProviders'
import { db, schema } from '../../db'

/** Eigenen KI-Anbieter speichern. Nur der Eigentümer. Leerer Anbieter = zurück zum Server-Standard. */
export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  const b = await readBody<{ provider?: string, model?: string, apiKey?: string, baseUrl?: string, clearKey?: boolean }>(event) || {}
  const provider = String(b.provider || '')
  const patch: Partial<typeof schema.collection.$inferInsert> = {}
  if (!provider) {
    Object.assign(patch, { aiProvider: '', aiModel: '', aiApiKeyEnc: '', aiBaseUrl: '' })
  } else {
    if (!AI_PROVIDER_IDS.includes(provider as any)) throw createError({ statusCode: 400, statusMessage: 'Unbekannter Anbieter' })
    const info = aiProvider(provider)!
    patch.aiProvider = provider
    patch.aiModel = String(b.model || info.defaultModel).trim().slice(0, 120)
    // Eigene Adresse nur bei Ollama und eigenem Server, und nur nach Prüfung (kein Link-Local, kein Redirect-Ziel)
    patch.aiBaseUrl = info.needsUrl ? await assertSafeBaseUrl(String(b.baseUrl || info.defaultUrl).trim().slice(0, 300)) : ''
    const urlChanged = info.needsUrl && patch.aiBaseUrl !== (collection.aiBaseUrl || '')
    if (b.clearKey || (urlChanged && !b.apiKey)) patch.aiApiKeyEnc = '' // gespeicherter Schlüssel darf nicht an eine neue Adresse wandern
    else if (typeof b.apiKey === 'string' && b.apiKey.trim()) patch.aiApiKeyEnc = encryptSecret(b.apiKey.trim().slice(0, 400))
    else if (collection.aiProvider !== provider) patch.aiApiKeyEnc = '' // Schlüssel eines anderen Anbieters nicht weiterverwenden
    const key = patch.aiApiKeyEnc !== undefined ? (patch.aiApiKeyEnc ? 'x' : '') : (collection.aiApiKeyEnc ? 'x' : '')
    if (info.needsKey && !key) throw createError({ statusCode: 400, statusMessage: `${info.label} braucht einen API-Schlüssel` })
    if (!patch.aiModel) throw createError({ statusCode: 400, statusMessage: 'Modellname fehlt' })
  }
  await db.update(schema.collection).set(patch).where(eq(schema.collection.id, collection.id))
  return { ok: true }
})
