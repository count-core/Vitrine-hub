import type { AiApi, AiProviderId } from '#shared/utils/aiProviders'

export interface AiSettings {
  provider: AiProviderId
  api: AiApi
  model: string
  apiKey: string
  baseUrl: string
  /** Ersatzmodelle bei 429/503/404 (nur Gemini aus der .env). */
  fallbackModels: string[]
  grounding: boolean
  source: 'env' | 'collection'
}

export interface JsonRequest {
  prompt: string
  imageBase64?: string
  schema: Record<string, unknown>
  temperature?: number
}

export interface JsonResult { raw: any, usage: any, text: string }

/** Zieht das erste JSON-Objekt aus einer Antwort, auch wenn ```json-Zäune drumherum stehen. */
export function extractJson(text: string): any {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '').trim()
  try { return JSON.parse(cleaned) } catch { /* weiter */ }
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('Antwort enthält kein JSON')
  return JSON.parse(m[0])
}

function base(url: string) { return url.replace(/\/+$/, '') }

/** Antwort als JSON; Nicht-JSON wird nicht zurückgegeben, damit keine fremden Seiteninhalte im Fehlertext landen. */
async function readJson(res: Response) {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { _text: `Antwort war kein JSON (${res.status})` } }
}
const NO_REDIRECT = { redirect: 'manual' as const }

export async function geminiJson(s: AiSettings, r: JsonRequest, model = s.model): Promise<JsonResult> {
  if (!s.apiKey) throw new Error('Gemini-Schlüssel fehlt')
  const parts: any[] = [{ text: r.prompt }]
  if (r.imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: r.imageBase64 } })
  const body = { contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', responseSchema: r.schema, temperature: r.temperature ?? 0.2 } }
  const res = await fetch(`${base(s.baseUrl || 'https://generativelanguage.googleapis.com')}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.apiKey }, body: JSON.stringify(body), ...NO_REDIRECT,
  })
  const json: any = await readJson(res)
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${json?.error?.message || json?._text?.slice(0, 200) || 'Fehler'}`)
  const text = (json?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('')
  return { raw: extractJson(text || '{}'), usage: json?.usageMetadata ?? null, text }
}

/** OpenAI Chat Completions, auch für Mistral, Groq, OpenRouter, LM Studio, vLLM, LiteLLM. */
export async function openaiJson(s: AiSettings, r: JsonRequest, model = s.model): Promise<JsonResult> {
  const content: any[] = [{ type: 'text', text: `${r.prompt}\n\nAnswer with a single JSON object matching this JSON schema exactly (no prose, no markdown):\n${JSON.stringify(r.schema)}` }]
  if (r.imageBase64) content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${r.imageBase64}` } })
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (s.apiKey) headers.Authorization = `Bearer ${s.apiKey}`
  if (s.provider === 'openrouter') { headers['HTTP-Referer'] = process.env.BETTER_AUTH_URL || 'http://localhost:3000'; headers['X-Title'] = process.env.APP_NAME || 'Vitrine-Hub' }
  const call = async (withFormat: boolean) => {
    const body: any = { model, temperature: r.temperature ?? 0.2, messages: [{ role: 'user', content }] }
    if (withFormat) body.response_format = { type: 'json_object' }
    const res = await fetch(`${base(s.baseUrl)}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(body), ...NO_REDIRECT })
    const json: any = await readJson(res)
    return { res, json }
  }
  let { res, json } = await call(true)
  // Manche Server kennen response_format nicht, dann ohne wiederholen
  if (!res.ok && res.status === 400 && /response_format|json_object/i.test(JSON.stringify(json))) ({ res, json } = await call(false))
  if (!res.ok) throw new Error(`${s.provider} ${res.status}: ${json?.error?.message || json?.error || json?._text?.slice(0, 200) || 'Fehler'}`)
  const msg = json?.choices?.[0]?.message
  const text = typeof msg?.content === 'string' ? msg.content : (msg?.content || []).map((p: any) => p.text || '').join('')
  return { raw: extractJson(text || '{}'), usage: json?.usage ?? null, text }
}

export async function anthropicJson(s: AiSettings, r: JsonRequest, model = s.model): Promise<JsonResult> {
  if (!s.apiKey) throw new Error('Anthropic-Schlüssel fehlt')
  const content: any[] = []
  if (r.imageBase64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: r.imageBase64 } })
  content.push({ type: 'text', text: `${r.prompt}\n\nAnswer with a single JSON object matching this JSON schema exactly (no prose, no markdown):\n${JSON.stringify(r.schema)}` })
  const body = { model, max_tokens: 4096, temperature: r.temperature ?? 0.2, messages: [{ role: 'user', content }] }
  const res = await fetch(`${base(s.baseUrl || 'https://api.anthropic.com')}/v1/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': s.apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body), ...NO_REDIRECT,
  })
  const json: any = await readJson(res)
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${json?.error?.message || json?._text?.slice(0, 200) || 'Fehler'}`)
  const text = (json?.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
  return { raw: extractJson(text || '{}'), usage: json?.usage ?? null, text }
}

export async function ollamaJson(s: AiSettings, r: JsonRequest, model = s.model): Promise<JsonResult> {
  const msg: any = { role: 'user', content: r.prompt }
  if (r.imageBase64) msg.images = [r.imageBase64]
  const body = { model, stream: false, format: r.schema, options: { temperature: r.temperature ?? 0 }, messages: [msg] }
  const res = await fetch(`${base(s.baseUrl || 'http://127.0.0.1:11434')}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...NO_REDIRECT })
  const json: any = await readJson(res)
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${json?.error || json?._text?.slice(0, 200) || 'Fehler'}`)
  const text = json?.message?.content || ''
  return { raw: extractJson(text || '{}'), usage: { total_duration: json?.total_duration }, text }
}

/** Eine JSON-Antwort vom konfigurierten Anbieter. Bei 429/503/404 werden Ersatzmodelle probiert. */
export async function generateJson(s: AiSettings, r: JsonRequest): Promise<JsonResult & { model: string }> {
  const fn = s.api === 'openai' ? openaiJson : s.api === 'anthropic' ? anthropicJson : s.api === 'ollama' ? ollamaJson : geminiJson
  const candidates = [s.model, ...s.fallbackModels.filter(m => m && m !== s.model)]
  let lastError: unknown
  for (const model of candidates) {
    try {
      const out = await fn(s, r, model)
      return { ...out, model }
    } catch (e: any) {
      lastError = e
      if (candidates.length === 1 || !/\b(503|429|404)\b/.test(e?.message || '')) throw e
      console.warn(`[ai] ${model} nicht verfügbar, versuche nächstes Modell:`, e.message)
    }
  }
  throw lastError
}

/** Modellnamen vom Anbieter holen, damit niemand Namen raten muss. */
export async function listModels(s: AiSettings): Promise<string[]> {
  const headers: Record<string, string> = {}
  let url = ''
  if (s.api === 'gemini') { url = `${base(s.baseUrl || 'https://generativelanguage.googleapis.com')}/v1beta/models?pageSize=200`; headers['x-goog-api-key'] = s.apiKey }
  else if (s.api === 'anthropic') { url = `${base(s.baseUrl || 'https://api.anthropic.com')}/v1/models?limit=100`; headers['x-api-key'] = s.apiKey; headers['anthropic-version'] = '2023-06-01' }
  else if (s.api === 'ollama') url = `${base(s.baseUrl || 'http://127.0.0.1:11434')}/api/tags`
  else { url = `${base(s.baseUrl)}/models`; if (s.apiKey) headers.Authorization = `Bearer ${s.apiKey}` }
  const res = await fetch(url, { headers, ...NO_REDIRECT })
  const json: any = await readJson(res)
  if (!res.ok) throw new Error(`${s.provider} ${res.status}: ${json?.error?.message || json?.error || json?._text?.slice(0, 200) || 'Fehler'}`)
  let names: string[] = []
  if (s.api === 'gemini') names = (json?.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m: any) => String(m.name).replace(/^models\//, ''))
  else if (s.api === 'ollama') names = (json?.models || []).map((m: any) => m.name)
  else names = (json?.data || []).map((m: any) => m.id)
  return names.filter(Boolean).sort()
}
