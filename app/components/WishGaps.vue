<template>
  <div class="flex flex-col gap-4">
    <section class="flex flex-col gap-3 rounded-2xl bg-white p-4 dark:bg-stone-900">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="flex items-center gap-1.5 font-display text-lg font-extrabold">Lücken im Bestand <InfoTip k="wish.gaps" /></h2>
          <p class="text-sm text-stone-500">Vergleicht die Katalognummern deiner Sammlung und meldet, was dazwischen fehlt.</p>
        </div>
        <UButton icon="i-lucide-search" :label="pending ? 'prüft …' : 'Sammlung prüfen'" :loading="pending" @click="run" />
      </div>
      <div v-if="d" class="flex flex-wrap items-center gap-3 text-sm">
        <UBadge color="primary" variant="soft">{{ d.total }} mögliche Lücken</UBadge>
        <span class="text-stone-500">{{ d.checked }} Positionen geprüft, {{ d.groups.length }} Bereiche</span>
        <span class="flex-1" />
        <UFormField label="Max. Lücke am Stück" size="xs" class="flex items-center gap-2">
          <UInput v-model="maxRun" size="xs" type="number" class="w-20 font-mono" @change="run" />
        </UFormField>
      </div>
      <p v-if="d && !d.groups.length" class="rounded-xl bg-stone-50 p-4 text-sm text-stone-500 dark:bg-stone-800">Keine Lücken gefunden. Das heißt entweder, die Nummernfolgen sind vollständig, oder es sind noch zu wenige Katalognummern erfasst. Die Analyse braucht mindestens drei Nummern je Gebiet.</p>

      <div v-for="g in d?.groups || []" :key="g.key" class="rounded-xl border border-stone-200 p-3 dark:border-stone-700">
        <div class="flex flex-wrap items-center gap-2">
          <b class="font-display">{{ g.area || 'ohne Gebiet' }}<span v-if="g.series"> · {{ g.series }}</span></b>
          <UBadge size="sm" color="neutral" variant="soft">{{ typeLabel(g.type) }}</UBadge>
          <span class="text-xs text-stone-500">{{ g.have }} vorhanden, Nr. {{ g.min }}–{{ g.max }}<span v-if="g.from"> · {{ g.from }}<span v-if="g.to !== g.from">–{{ g.to }}</span></span></span>
          <span class="flex-1" />
          <UButton size="xs" color="neutral" variant="ghost" :label="allSelected(g) ? 'Keine' : 'Alle'" @click="toggleGroup(g)" />
        </div>
        <p class="mt-1 text-xs text-stone-500">Fehlt: <span class="font-mono">{{ formatRanges(g.missing) }}</span></p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="n in g.missing" :key="n" type="button" class="rounded-lg px-2 py-1 font-mono text-xs font-semibold transition" :class="selected.has(key(g, n)) ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'" @click="toggle(g, n)">{{ n }}</button>
        </div>
      </div>

      <div v-if="selected.size" class="sticky bottom-20 flex items-center gap-2 rounded-xl bg-stone-900 p-3 text-white dark:bg-white dark:text-stone-900 md:bottom-2">
        <span class="flex-1 text-sm font-semibold">{{ selected.size }} ausgewählt</span>
        <UFormField size="xs"><USelect v-model="wishCondition" :items="condItems" size="xs" class="w-36" /></UFormField>
        <UButton size="sm" color="primary" :label="adding ? 'trägt ein …' : 'Auf die Wunschliste'" :loading="adding" @click="add" />
      </div>
    </section>

    <section class="flex flex-col gap-3 rounded-2xl bg-white p-4 dark:bg-stone-900">
      <div>
        <h2 class="flex items-center gap-1.5 font-display text-lg font-extrabold">Serie vervollständigen <InfoTip k="wish.series" /></h2>
        <p class="text-sm text-stone-500">Die KI nennt die Ausgaben einer Serie und markiert, was dir noch fehlt. Vorschläge, kein Katalog.</p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <UFormField label="Serie aus deiner Sammlung" class="min-w-52 flex-1">
          <UInputMenu v-model="series" :items="seriesItems" create-item class="w-full" @create="series = $event" />
        </UFormField>
        <UFormField label="Gebiet" class="w-44"><UInputMenu v-model="area" :items="AREAS" create-item class="w-full" @create="area = $event" /></UFormField>
        <UButton icon="i-lucide-sparkles" :label="suggesting ? 'fragt KI …' : 'Fehlende ermitteln'" :loading="suggesting" @click="suggest" />
      </div>
      <template v-if="sug">
        <p class="text-sm"><b>{{ sug.missing }}</b> von {{ sug.suggestions.length }} Ausgaben fehlen dir. <span class="text-stone-500">Modell {{ sug.model }}.<span v-if="sug.source"> {{ sug.source }}</span></span></p>
        <p v-if="!sug.suggestions.length" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Die KI kennt diese Serie nicht sicher genug. Versuch einen genaueren Namen, zum Beispiel „Olympiade 1972 Bund" statt „Olympia".</p>
        <div class="flex flex-col gap-1.5">
          <label v-for="(s, i) in sug.suggestions" :key="i" class="flex items-center gap-2 rounded-xl p-2 text-sm" :class="s.owned ? 'bg-stone-50 text-stone-400 dark:bg-stone-800' : 'cursor-pointer bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700'">
            <UCheckbox v-if="!s.owned" :model-value="sugSel.has(i)" @update:model-value="toggleSug(i)" />
            <UIcon v-else name="i-lucide-check" class="size-4 shrink-0 text-emerald-500" />
            <span class="min-w-0 flex-1"><b v-if="s.michelNo" class="font-mono">{{ s.michelNo }}</b> {{ s.motif }}<span v-if="s.faceValue" class="text-stone-500"> · {{ s.faceValue }}</span><span v-if="s.note" class="block text-xs text-stone-500">{{ s.note }}</span></span>
            <span v-if="s.owned" class="shrink-0 text-xs">hast du</span>
          </label>
        </div>
        <div v-if="sugSel.size" class="flex items-center gap-2">
          <UButton size="sm" :label="`${sugSel.size} auf die Wunschliste`" :loading="adding" @click="addSuggestions" />
          <UButton size="sm" color="neutral" variant="ghost" label="Auswahl leeren" @click="sugSel.clear()" />
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatRanges } from '#shared/utils/ranges'

const emit = defineEmits<{ added: [] }>()
const toast = useToast()
const condItems = CONDITIONS.slice(0, 4).map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value as string }))
const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label || t

const maxRun = ref(10)
const d = ref<any>(null)
const pending = ref(false)
const selected = reactive(new Set<string>())
const wishCondition = ref('mnh')
const key = (g: any, n: number) => `${g.key}|${n}`

async function run() {
  pending.value = true
  try { d.value = await $fetch('/api/wishlist/gaps', { query: { maxRun: maxRun.value } }); selected.clear() }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Analyse fehlgeschlagen', color: 'error' }) }
  finally { pending.value = false }
}
function toggle(g: any, n: number) { const k = key(g, n); selected.has(k) ? selected.delete(k) : selected.add(k) }
const allSelected = (g: any) => g.missing.every((n: number) => selected.has(key(g, n)))
function toggleGroup(g: any) { const all = allSelected(g); for (const n of g.missing) all ? selected.delete(key(g, n)) : selected.add(key(g, n)) }

const adding = ref(false)
async function add() {
  const entries = (d.value?.groups || []).flatMap((g: any) => g.missing.filter((n: number) => selected.has(key(g, n))).map((n: number) => ({ area: g.area, type: g.type, series: g.series, michelNo: String(n), year: g.from, condition: wishCondition.value })))
  if (!entries.length) return
  adding.value = true
  try {
    const r = await $fetch<{ added: number, skipped: number }>('/api/wishlist/from-gaps', { method: 'POST', body: { entries } })
    toast.add({ title: `${r.added} auf die Wunschliste`, description: r.skipped ? `${r.skipped} waren schon eingetragen.` : undefined, color: 'success' })
    selected.clear(); emit('added'); await run()
  } catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  finally { adding.value = false }
}

// --- KI-Serienvorschläge ---
const { data: facets } = await useFetch<any>('/api/items/facets')
const seriesItems = computed<string[]>(() => (facets.value?.series || []).map((s: any) => s.value ?? s).filter(Boolean))
const series = ref(''), area = ref('')
const sug = ref<{ suggestions: any[], [k: string]: any } | null>(null), suggesting = ref(false)
const sugSel = reactive(new Set<number>())
function toggleSug(i: number) { sugSel.has(i) ? sugSel.delete(i) : sugSel.add(i) }

async function suggest() {
  if (!series.value && !area.value) { toast.add({ title: 'Serie oder Gebiet wählen', color: 'warning' }); return }
  suggesting.value = true; sug.value = null; sugSel.clear()
  try { sug.value = await $fetch<any>('/api/wishlist/suggest', { method: 'POST', body: { series: series.value, area: area.value } }) }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'KI-Abfrage fehlgeschlagen', color: 'error' }) }
  finally { suggesting.value = false }
}
async function addSuggestions() {
  const s0 = sug.value; if (!s0) return
  const entries = [...sugSel].map(i => s0.suggestions[i]).filter(Boolean).map((s: any) => ({ area: area.value || s0.area, type: s.type || 'stamp', series: s0.series, michelNo: s.michelNo, motif: s.motif, year: s.year, condition: wishCondition.value }))
  adding.value = true
  try {
    const r = await $fetch<{ added: number, skipped: number }>('/api/wishlist/from-gaps', { method: 'POST', body: { entries } })
    toast.add({ title: `${r.added} auf die Wunschliste`, color: 'success' })
    sugSel.clear(); emit('added')
  } catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  finally { adding.value = false }
}
</script>
