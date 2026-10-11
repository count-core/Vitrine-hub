import { aiProvider, type AiProviderId } from '#shared/utils/aiProviders'
import { generateJson, type AiSettings } from './client'
import { normalizeResponse } from './normalize'
import { buildPrompt, responseJsonSchema, type CaptureMode } from './schema'


/** Einstellungen aus der .env (Server-Standard). */
export function aiSettingsFromConfig(): AiSettings {
  const c = useRuntimeConfig().ai as { provider: string, geminiApiKey: string, geminiModel: string, geminiFallbackModels?: string, grounding: boolean, ollamaUrl: string, ollamaModel: string }
  if (c.provider === 'ollama') return { provider: 'ollama', api: 'ollama', model: c.ollamaModel, apiKey: '', baseUrl: c.ollamaUrl, fallbackModels: [], grounding: false, source: 'env' }
  return {
    provider: 'gemini', api: 'gemini', model: c.geminiModel, apiKey: c.geminiApiKey, baseUrl: 'https://generativelanguage.googleapis.com',
    fallbackModels: (c.geminiFallbackModels || '').split(',').map(s => s.trim()).filter(Boolean), grounding: c.grounding === true, source: 'env',
  }
}

export interface CollectionAiFields { aiProvider?: string | null, aiModel?: string | null, aiApiKeyEnc?: string | null, aiBaseUrl?: string | null }

/** Einstellungen aus Feldern (Sammlung oder ungespeichertes Formular) bauen, ohne Fallback. */
export function aiSettingsFromFields(f: { provider: string, model?: string, apiKey?: string, baseUrl?: string }): AiSettings | null {
  const info = aiProvider(f.provider)
  if (!info) return null
  return {
    provider: info.id, api: info.api, model: (f.model || info.defaultModel).trim(), apiKey: (f.apiKey || '').trim(),
    // Benannte Anbieter bekommen immer ihre feste Adresse, damit ein Schlüssel nie an einen fremden Host geht
    baseUrl: info.needsUrl ? (f.baseUrl || info.defaultUrl).trim() : info.defaultUrl, fallbackModels: [], grounding: false, source: 'collection',
  }
}

/** Anbieter der Sammlung, sonst Server-Standard aus der .env. */
export function resolveAiSettings(c?: CollectionAiFields | null): AiSettings {
  const env = aiSettingsFromConfig()
  if (!c?.aiProvider) return env
  const s = aiSettingsFromFields({ provider: c.aiProvider, model: c.aiModel || '', apiKey: c.aiApiKeyEnc ? decryptSecret(c.aiApiKeyEnc) : '', baseUrl: c.aiBaseUrl || '' })
  if (!s) return env
  const info = aiProvider(s.provider)!
  if ((info.needsKey && !s.apiKey) || !s.model) return env
  return s
}

export function isConfigured(s: AiSettings) {
  const info = aiProvider(s.provider)
  return !!s.model && (!info?.needsKey || !!s.apiKey)
}

export async function analyzeImage(imageBase64: string, hint: string | undefined, settings: AiSettings = aiSettingsFromConfig(), mode: CaptureMode = 'auto') {
  const t0 = Date.now()
  const result = await generateJson(settings, { prompt: buildPrompt(hint, mode), imageBase64, schema: responseJsonSchema as unknown as Record<string, unknown>, temperature: settings.api === 'ollama' ? 0 : 0.2 })
  return {
    provider: settings.provider as AiProviderId,
    model: result.model,
    raw: result.raw,
    usage: result.usage,
    stamps: normalizeResponse(result.raw),
    durationMs: Date.now() - t0,
  }
}
