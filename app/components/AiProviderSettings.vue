<template>
  <section class="flex flex-col gap-3 rounded-3xl bg-white p-5 dark:bg-stone-900">
    <div class="flex items-center gap-2"><h2 class="text-xs font-bold uppercase tracking-wider text-stone-500">KI-Erkennung</h2><InfoTip k="settings.aiProvider" /></div>

    <div v-if="cfg" class="rounded-2xl bg-stone-100 p-3 text-sm dark:bg-stone-800">
      <p><b>Aktiv:</b> {{ cfg.active.label }} · <span class="font-mono">{{ cfg.active.model }}</span>
        <UBadge size="sm" variant="soft" :color="cfg.active.source === 'collection' ? 'primary' : 'neutral'" class="ml-1">{{ cfg.active.source === 'collection' ? 'eigener Schlüssel' : 'Server-Standard' }}</UBadge></p>
      <p v-if="!cfg.active.configured" class="mt-1 text-red-600">Kein Anbieter einsatzbereit. Erfassen speichert Fotos, liefert aber keine Vorschläge.</p>
      <p v-else-if="cfg.active.source === 'env'" class="mt-1 text-xs text-stone-500">Server-Standard: {{ cfg.server.label }}. Du kannst darunter einen eigenen Anbieter oder Schlüssel für diese Sammlung hinterlegen.</p>
    </div>

    <template v-if="cfg?.role === 'owner'">
      <UFormField label="Anbieter">
        <template #hint><InfoTip k="settings.aiProvider" /></template>
        <USelect v-model="f.provider" :items="providerItems" class="w-full" @update:model-value="onProvider" />
      </UFormField>

      <div v-if="info" class="flex flex-col gap-2 rounded-2xl border border-stone-200 p-3 text-sm dark:border-stone-700">
        <p>{{ info.description }}</p>
        <p class="flex gap-2"><UIcon name="i-lucide-coins" class="mt-0.5 size-4 shrink-0 text-stone-400" /><span>{{ info.cost }}</span></p>
        <p class="flex gap-2"><UIcon name="i-lucide-shield" class="mt-0.5 size-4 shrink-0 text-stone-400" /><span>{{ info.privacy }}</span></p>
        <p class="flex gap-2"><UIcon name="i-lucide-image" class="mt-0.5 size-4 shrink-0 text-stone-400" /><span>{{ info.visionNote }}</span></p>
        <details class="mt-1">
          <summary class="cursor-pointer font-semibold">{{ info.needsKey ? 'So legst du den Schlüssel an' : 'So richtest du das ein' }}</summary>
          <ol class="mt-2 list-decimal space-y-1 pl-5">
            <li v-for="s in info.keySteps" :key="s">{{ s }}</li>
          </ol>
          <UButton v-if="info.keyUrl" :to="info.keyUrl" target="_blank" rel="noopener" size="sm" color="neutral" variant="soft" icon="i-lucide-external-link" class="mt-2" :label="info.needsKey ? 'Schlüssel-Seite öffnen' : 'Download-Seite öffnen'" />
        </details>
      </div>

      <template v-if="info">
        <UFormField v-if="info?.needsUrl || f.provider === 'custom'" label="Adresse">
          <template #hint><InfoTip k="settings.aiUrl" /></template>
          <UInput v-model="f.baseUrl" :placeholder="info?.defaultUrl" class="w-full font-mono" />
        </UFormField>
        <UFormField v-if="info?.needsKey || f.provider === 'custom'" label="API-Schlüssel" :description="cfg?.saved.hasKey && cfg.saved.provider === f.provider ? `Gespeichert: ${cfg.saved.keyHint}. Leer lassen, um ihn zu behalten.` : ''">
          <template #hint><InfoTip k="settings.aiKey" /></template>
          <UInput v-model="f.apiKey" type="password" autocomplete="off" :placeholder="cfg?.saved.hasKey && cfg.saved.provider === f.provider ? '(unverändert)' : 'Schlüssel einfügen'" class="w-full font-mono" />
        </UFormField>
        <UFormField label="Modell">
          <template #hint><InfoTip k="settings.aiModel" /></template>
          <div class="flex gap-2">
            <UInputMenu v-model="f.model" :items="modelItems" create-item class="w-full font-mono" @create="f.model = $event" />
            <UButton size="sm" color="neutral" variant="soft" :loading="loadingModels" label="Modelle laden" @click="loadModels" />
          </div>
        </UFormField>
      </template>

      <div v-if="testResult" class="rounded-2xl p-3 text-sm" :class="testResult.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'">
        <template v-if="testResult.ok">Verbindung klappt. Modell <span class="font-mono">{{ testResult.model }}</span> hat in {{ testResult.ms }} ms geantwortet.</template>
        <template v-else>Test fehlgeschlagen: {{ testResult.error }}</template>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton v-if="info" label="Verbindung testen" color="neutral" variant="soft" icon="i-lucide-plug-zap" :loading="testing" @click="test" />
        <UButton label="Speichern" :loading="saving" @click="save" />
        <UButton v-if="cfg?.saved.provider" label="Server-Standard verwenden" color="neutral" variant="ghost" @click="reset" />
      </div>
    </template>
    <p v-else class="text-xs text-stone-500">Nur der Eigentümer der Sammlung kann den KI-Anbieter ändern.</p>
  </section>
</template>

<script setup lang="ts">
import { AI_PROVIDERS, aiProvider } from '#shared/utils/aiProviders'

const toast = useToast()
const { data: cfg, refresh } = await useFetch('/api/ai/config', { key: 'ai-config' })
const emit = defineEmits<{ saved: [] }>()

const providerItems = [{ label: 'Server-Standard (keine eigene Einstellung)', value: 'server' }, ...AI_PROVIDERS.map(p => ({ label: p.label, value: p.id }))]
const f = reactive({ provider: '' as string, model: '', apiKey: '', baseUrl: '' })
const info = computed(() => aiProvider(f.provider))
const loadedModels = ref<string[]>([])
const modelItems = computed(() => Array.from(new Set([...loadedModels.value, ...(info.value?.models || []), f.model].filter(Boolean))))

watch(cfg, (c) => { if (c) Object.assign(f, { provider: c.saved.provider || 'server', model: c.saved.model || '', baseUrl: c.saved.baseUrl || '', apiKey: '' }) }, { immediate: true })
// "server" ist nur ein Platzhalterwert für die Auswahl (USelect mag keine leeren Werte); gespeichert wird leer
const providerValue = computed(() => f.provider === 'server' ? '' : f.provider)

function onProvider(v: string) {
  const p = aiProvider(v)
  f.model = p?.defaultModel || ''
  f.baseUrl = p?.needsUrl ? p.defaultUrl : ''
  f.apiKey = ''
  loadedModels.value = []
  testResult.value = null
}

const loadingModels = ref(false)
async function loadModels() {
  loadingModels.value = true
  try {
    const r = await $fetch<{ models: string[] }>('/api/ai/models', { query: { provider: f.provider, apiKey: f.apiKey || undefined, baseUrl: f.baseUrl || undefined } })
    loadedModels.value = r.models
    toast.add({ title: `${r.models.length} Modelle geladen`, color: 'success' })
  } catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Modelle konnten nicht geladen werden', color: 'error' }) }
  finally { loadingModels.value = false }
}

const testing = ref(false)
const testResult = ref<{ ok: boolean, model?: string, ms?: number, error?: string } | null>(null)
async function test() {
  testing.value = true; testResult.value = null
  try { testResult.value = await $fetch<any>('/api/ai/test', { method: 'POST', body: { provider: f.provider, model: f.model, apiKey: f.apiKey || undefined, baseUrl: f.baseUrl || undefined } }) }
  catch (e: any) { testResult.value = { ok: false, error: e?.data?.statusMessage || 'Fehler' } }
  finally { testing.value = false }
}

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await $fetch('/api/ai/config', { method: 'PATCH', body: { provider: providerValue.value, model: f.model, apiKey: f.apiKey || undefined, baseUrl: f.baseUrl || undefined } })
    f.apiKey = ''
    await refresh(); emit('saved')
    toast.add({ title: 'KI-Einstellungen gespeichert', color: 'success' })
  } catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  finally { saving.value = false }
}
async function reset() {
  try { await $fetch('/api/ai/config', { method: 'PATCH', body: { provider: '' } }); await refresh(); emit('saved'); testResult.value = null; toast.add({ title: 'Server-Standard aktiv', color: 'success' }) }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
}
</script>
