/**
 * Katalog der KI-Anbieter, die man in den Einstellungen anbinden kann.
 * Wird im Frontend (Auswahl, Anleitung) und im Server (Aufruf) genutzt.
 */
export type AiApi = 'gemini' | 'openai' | 'anthropic' | 'ollama'
export type AiProviderId = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'groq' | 'openrouter' | 'ollama' | 'custom'

export interface AiProviderInfo {
  id: AiProviderId
  label: string
  /** Welches API-Format der Anbieter spricht. */
  api: AiApi
  /** Ein Satz, was das ist. */
  description: string
  /** Kosten und Free-Tier in einem Satz. */
  cost: string
  /** Datenschutz-Hinweis in einem Satz. */
  privacy: string
  needsKey: boolean
  needsUrl: boolean
  defaultUrl: string
  keyUrl: string
  keySteps: string[]
  defaultModel: string
  /** Vorschläge fürs Modellfeld. "Modelle laden" holt die echte Liste vom Anbieter. */
  models: string[]
  /** Kann Bilder verstehen? Ohne das geht Erfassen per Foto nicht. */
  visionNote: string
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: 'gemini', label: 'Google Gemini', api: 'gemini',
    description: 'Googles Modelle über Google AI Studio. Standard in Vitrine-Hub, weil der kostenlose Zugang für die Fotoerkennung reicht.',
    cost: 'Kostenlos mit Tageslimit (Free Tier), keine Kreditkarte nötig. Bei viel Nutzung kommt irgendwann ein 429-Fehler, dann am nächsten Tag weiter.',
    privacy: 'Im Free Tier darf Google Eingaben zum Training nutzen. Für eine Sammlung unkritisch, aber keine privaten Dokumente hochladen.',
    needsKey: true, needsUrl: false, defaultUrl: 'https://generativelanguage.googleapis.com',
    keyUrl: 'https://aistudio.google.com/apikey',
    keySteps: [
      'Mit einem Google-Konto auf aistudio.google.com/apikey anmelden.',
      'Auf "API-Schlüssel erstellen" klicken, ggf. ein neues Projekt anlegen lassen.',
      'Den Schlüssel (beginnt mit "AIza" oder "AQ.") kopieren und hier einfügen.',
      'Kein Abrechnungskonto nötig. Der Schlüssel gilt sofort.',
    ],
    defaultModel: 'gemini-3.6-flash',
    models: ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'],
    visionNote: 'Alle Flash- und Pro-Modelle verstehen Bilder.',
  },
  {
    id: 'openai', label: 'OpenAI (ChatGPT)', api: 'openai',
    description: 'GPT-Modelle über die OpenAI-API. Sehr gute Erkennung, kostet aber pro Foto ein paar Cent.',
    cost: 'Kein Free Tier. Guthaben aufladen (ab 5 US-Dollar), ein Albumblatt kostet je nach Modell etwa 0,5 bis 3 Cent.',
    privacy: 'API-Eingaben werden laut OpenAI nicht zum Training genutzt.',
    needsKey: true, needsUrl: false, defaultUrl: 'https://api.openai.com/v1',
    keyUrl: 'https://platform.openai.com/api-keys',
    keySteps: [
      'Auf platform.openai.com anmelden (nicht chatgpt.com, das ist ein anderes Konto).',
      'Unter "Billing" Guthaben aufladen, sonst lehnt die API alle Anfragen ab.',
      'Unter "API keys" auf "Create new secret key" klicken, Namen vergeben.',
      'Den Schlüssel (beginnt mit "sk-") sofort kopieren, er wird nur einmal angezeigt.',
    ],
    defaultModel: 'gpt-5-mini',
    models: ['gpt-5-mini', 'gpt-5', 'gpt-4.1-mini'],
    visionNote: 'GPT-4.1 und GPT-5 verstehen Bilder. Modellliste über "Modelle laden" prüfen.',
  },
  {
    id: 'anthropic', label: 'Anthropic (Claude)', api: 'anthropic',
    description: 'Claude-Modelle über die Anthropic-API. Sehr sorgfältig bei Text auf Marken und Münzen.',
    cost: 'Kein Free Tier. Guthaben aufladen (ab 5 US-Dollar), ein Albumblatt kostet mit Haiku unter 1 Cent, mit Sonnet wenige Cent.',
    privacy: 'API-Eingaben werden nicht zum Training genutzt.',
    needsKey: true, needsUrl: false, defaultUrl: 'https://api.anthropic.com',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keySteps: [
      'Auf console.anthropic.com ein Konto anlegen.',
      'Unter "Plans & Billing" Guthaben aufladen.',
      'Unter "API Keys" auf "Create Key" klicken.',
      'Den Schlüssel (beginnt mit "sk-ant-") kopieren und hier einfügen.',
    ],
    defaultModel: 'claude-haiku-4-5-20251001',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-5', 'claude-opus-5'],
    visionNote: 'Alle aktuellen Claude-Modelle verstehen Bilder.',
  },
  {
    id: 'mistral', label: 'Mistral AI', api: 'openai',
    description: 'Europäischer Anbieter aus Frankreich mit OpenAI-kompatibler API. Server in der EU.',
    cost: 'Free Tier "Experiment" mit Limits nach Telefonnummer-Bestätigung, sonst günstige Preise pro Anfrage.',
    privacy: 'EU-Anbieter, im Free Tier können Eingaben zur Verbesserung genutzt werden.',
    needsKey: true, needsUrl: false, defaultUrl: 'https://api.mistral.ai/v1',
    keyUrl: 'https://console.mistral.ai/api-keys',
    keySteps: [
      'Auf console.mistral.ai anmelden und den kostenlosen "Experiment"-Plan wählen.',
      'Telefonnummer bestätigen, sonst ist der Free Tier gesperrt.',
      'Unter "API Keys" auf "Create new key" klicken und den Schlüssel kopieren.',
    ],
    defaultModel: 'pixtral-large-latest',
    models: ['pixtral-large-latest', 'mistral-medium-latest', 'pixtral-12b-latest'],
    visionNote: 'Nur Pixtral- und Mistral-Medium-Modelle verstehen Bilder.',
  },
  {
    id: 'groq', label: 'Groq', api: 'openai',
    description: 'Sehr schnelle offene Modelle (Llama) über eine OpenAI-kompatible API.',
    cost: 'Kostenloser Zugang mit Tageslimit, keine Kreditkarte nötig.',
    privacy: 'US-Anbieter, Eingaben werden laut Groq nicht gespeichert.',
    needsKey: true, needsUrl: false, defaultUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys',
    keySteps: [
      'Auf console.groq.com mit Google oder GitHub anmelden.',
      'Unter "API Keys" auf "Create API Key" klicken.',
      'Den Schlüssel (beginnt mit "gsk_") kopieren und hier einfügen.',
    ],
    defaultModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    models: ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'],
    visionNote: 'Nur Llama-4-Modelle verstehen Bilder. Erkennung ist etwas gröber als bei Gemini.',
  },
  {
    id: 'openrouter', label: 'OpenRouter', api: 'openai',
    description: 'Ein Schlüssel für viele Anbieter (Google, OpenAI, Anthropic, Meta). Praktisch zum Ausprobieren.',
    cost: 'Einige Modelle mit ":free" im Namen sind kostenlos mit Limit, der Rest wird pro Anfrage vom Guthaben abgezogen.',
    privacy: 'Vermittler in den USA, leitet an den jeweiligen Anbieter weiter.',
    needsKey: true, needsUrl: false, defaultUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/settings/keys',
    keySteps: [
      'Auf openrouter.ai anmelden.',
      'Unter "Keys" auf "Create Key" klicken.',
      'Den Schlüssel (beginnt mit "sk-or-") kopieren und hier einfügen.',
      'Modellnamen im Format "anbieter/modell" eintragen, z. B. google/gemini-2.5-flash.',
    ],
    defaultModel: 'google/gemini-2.5-flash',
    models: ['google/gemini-2.5-flash', 'openai/gpt-5-mini', 'anthropic/claude-sonnet-4.5', 'meta-llama/llama-4-scout:free'],
    visionNote: 'Modell muss "Bilder" unterstützen, auf openrouter.ai/models nach "image" filtern.',
  },
  {
    id: 'ollama', label: 'Ollama (lokal)', api: 'ollama',
    description: 'Modelle laufen auf dem eigenen Rechner oder Server. Keine Daten verlassen das Haus, dafür langsamer und ungenauer.',
    cost: 'Kostenlos, braucht einen Rechner mit mindestens 8 GB RAM, besser eine Grafikkarte.',
    privacy: 'Komplett lokal, nichts wird ins Internet geschickt.',
    needsKey: false, needsUrl: true, defaultUrl: 'http://127.0.0.1:11434',
    keyUrl: 'https://ollama.com/download',
    keySteps: [
      'Ollama von ollama.com installieren und starten.',
      'Im Terminal ein Bildmodell laden: ollama pull gemma3:4b',
      'Die Adresse eintragen, unter der der Vitrine-Hub-Server Ollama erreicht (Standard http://127.0.0.1:11434).',
      'Kein Schlüssel nötig.',
    ],
    defaultModel: 'gemma3:4b',
    models: ['gemma3:4b', 'gemma3:12b', 'llama3.2-vision', 'qwen2.5vl:7b'],
    visionNote: 'Nur Modelle mit Bildunterstützung (gemma3, llama3.2-vision, qwen2.5vl) funktionieren.',
  },
  {
    id: 'custom', label: 'Eigener OpenAI-kompatibler Server', api: 'openai',
    description: 'Für alles, was die OpenAI-Chat-API spricht: LM Studio, vLLM, LiteLLM, Azure OpenAI, Together, DeepSeek, Firmenserver.',
    cost: 'Je nach Anbieter.',
    privacy: 'Je nach Anbieter.',
    needsKey: false, needsUrl: true, defaultUrl: 'http://127.0.0.1:1234/v1',
    keyUrl: '',
    keySteps: [
      'Die Basis-Adresse eintragen, meist endet sie auf /v1.',
      'Falls der Server einen Schlüssel verlangt, hier eintragen, sonst leer lassen.',
      'Modellnamen genau so eintragen, wie der Server ihn unter /models auflistet.',
    ],
    defaultModel: '',
    models: [],
    visionNote: 'Das Modell muss Bilder verstehen, sonst bleibt die Erkennung leer.',
  },
]

export const AI_PROVIDER_IDS = AI_PROVIDERS.map(p => p.id)
export function aiProvider(id: string | null | undefined): AiProviderInfo | undefined {
  return AI_PROVIDERS.find(p => p.id === id)
}
