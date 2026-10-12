<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h1 class="font-display text-3xl font-extrabold">Sammlung <span class="text-base font-semibold text-stone-500 tabular">{{ data?.total ?? 0 }} Positionen</span></h1>
      <div class="flex gap-2">
        <UButton :icon="view === 'grid' ? 'i-lucide-list' : 'i-lucide-layout-grid'" color="neutral" variant="soft" :label="view === 'grid' ? 'Tabelle' : 'Kacheln'" @click="view = view === 'grid' ? 'table' : 'grid'" />
        <UButton icon="i-lucide-book-open" label="Alben" to="/alben" color="neutral" variant="soft" class="hidden md:inline-flex" />
        <UButton icon="i-lucide-plus" label="Neu" to="/sammlung/neu" color="neutral" variant="soft" />
      </div>
    </div>
    <UInput v-model="f.q" icon="i-lucide-search" placeholder="Nummer, Motiv, Jahr, Gebiet, Notiz …" size="xl" class="w-full" :ui="{ base: 'rounded-full' }" />
    <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-24px),transparent)] [scrollbar-width:none]">
      <UButton v-for="t in typeChips" :key="t.value" :variant="f.type === t.value ? 'solid' : 'soft'" color="neutral" class="rounded-full whitespace-nowrap" :label="t.label" @click="f.type = t.value" />
      <span class="w-px shrink-0 bg-stone-300" />
      <UButton :variant="!f.area ? 'solid' : 'soft'" color="neutral" class="rounded-full whitespace-nowrap" label="Alle Gebiete" @click="f.area = ''" />
      <UButton v-for="a in facets?.areas || []" :key="a.value" :variant="f.area === a.value ? 'solid' : 'soft'" color="neutral" class="rounded-full whitespace-nowrap" :label="`${a.value} ${a.n}`" @click="f.area = f.area === a.value ? '' : a.value" />
    </div>
    <div class="flex flex-wrap gap-2">
      <USelect v-model="f.condition" :items="condItems" placeholder="Erhaltung" class="w-40" size="sm" />
      <USelect v-model="f.status" :items="statusItems" placeholder="Status" class="w-40" size="sm" />
      <USelect v-model="f.albumId" :items="albumItems" placeholder="Album" class="w-44" size="sm" />
      <USelect v-model="f.sort" :items="sortItems" class="w-44" size="sm" />
      <UButton v-if="hasFilter" label="Filter zurücksetzen" variant="link" color="neutral" size="sm" @click="reset" />
    </div>

    <div v-if="selected.size" class="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-2xl bg-stone-900 p-2 pl-4 text-white shadow-lg dark:bg-white dark:text-stone-900">
      <span class="text-sm font-semibold">{{ selected.size }} gewählt</span>
      <USelect :items="statusItems.slice(1)" placeholder="Status setzen" size="sm" class="w-40" @update:model-value="bulk({ patch: { status: $event } })" />
      <UButton size="sm" color="neutral" variant="soft" label="Album/Blatt" @click="askAlbum" />
      <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-sparkles" label="KI-Preisschätzung" :loading="estimating" @click="bulkEstimate" />
      <UButton size="sm" color="error" variant="soft" label="Löschen" @click="bulkDelete" />
      <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-x" @click="selected.clear()" />
    </div>

    <div v-if="pending && !data" class="py-10 text-center text-stone-500">Lade …</div>
    <div v-else-if="!data?.items?.length" class="rounded-2xl bg-white p-10 text-center text-stone-500 dark:bg-stone-900">Keine Treffer.</div>
    <div v-else-if="view === 'grid'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <ItemCard v-for="it in data.items" :key="it.id" :item="it" selectable :selected="selected.has(it.id)" @toggle="toggle(it.id)" />
    </div>
    <div v-else class="overflow-x-auto rounded-2xl bg-white dark:bg-stone-900">
      <table class="w-full min-w-[720px] text-sm">
        <thead class="text-left text-[11px] uppercase tracking-wider text-stone-500"><tr>
          <th class="p-3"><UCheckbox :model-value="allSelected" @update:model-value="toggleAll" /></th><th class="p-3" /><th class="p-3">Nr.</th><th class="p-3">Gebiet</th><th class="p-3">Jahr</th><th class="p-3">Motiv</th><th class="p-3">Erh.</th><th class="p-3 text-right">Menge</th><th class="p-3">Lager</th><th class="p-3 text-right">KW</th>
        </tr></thead>
        <tbody>
          <tr v-for="it in data.items" :key="it.id" class="cursor-pointer border-t border-stone-100 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800" @click="navigateTo(`/sammlung/${it.id}`)">
            <td class="p-3" @click.stop><UCheckbox :model-value="selected.has(it.id)" @update:model-value="toggle(it.id)" /></td>
            <td class="p-2"><StampImage :file-key="it.images?.[0]?.fileKey" :size="30" /></td>
            <td class="p-3 whitespace-nowrap font-mono">{{ catalogRef(it) }}</td><td class="p-3">{{ it.area }}</td><td class="p-3 font-mono">{{ it.year }}</td><td class="p-3">{{ it.motif }}</td>
            <td class="p-3"><ConditionBadge :value="it.condition" /></td><td class="p-3 text-right tabular">{{ it.quantity }}</td>
            <td class="p-3 font-mono text-xs">{{ it.album ? `A${it.album.number}/B${it.sheet ?? '–'}` : '' }}</td><td class="p-3 text-right tabular">{{ eur(it.catalogValue) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <UPagination v-if="data && data.total > data.limit" v-model:page="page" :total="data.total" :items-per-page="data.limit" class="self-center" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { eur } = useLabels()
const view = ref<'grid' | 'table'>('grid')
onMounted(() => { try { const v = localStorage.getItem('view'); if (v === 'table' || v === 'grid') view.value = v } catch {} })
watch(view, v => { try { localStorage.setItem('view', v) } catch {} })
const ALL = '*'
const f = reactive({ q: '', area: '', condition: ALL, status: (route.query.status as string) || ALL, albumId: (route.query.albumId as string) || ALL, sheet: (route.query.sheet as string) || '', type: (route.query.type as string) || '', series: (route.query.series as string) || '', sort: 'michel' })
const page = ref(1)
watch(() => ({ ...f }), () => { page.value = 1 }, { deep: true })
const clean = (v: string) => v === ALL ? '' : v
const query = computed(() => ({ q: f.q, area: f.area, condition: clean(f.condition), status: clean(f.status), albumId: clean(f.albumId), sheet: f.sheet, type: f.type, series: f.series, sort: f.sort, page: page.value, limit: 60 }))
const { data, pending, refresh } = await useFetch<{ items: any[], total: number, page: number, limit: number }>('/api/items', { query, watch: [query] })
const { data: facets, refresh: refreshFacets } = await useFetch('/api/items/facets')
const condItems = [{ label: 'Alle Erhaltungen', value: ALL }, ...CONDITIONS.map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value }))]
const statusItems = [{ label: 'Alle Status', value: ALL }, ...STATUSES.map(s => ({ label: s.label, value: s.value }))]
const albumItems = computed(() => [{ label: 'Alle Alben', value: ALL }, ...(facets.value?.albums || []).map((a: any) => ({ label: `Album ${a.number}${a.name && a.name !== `Album ${a.number}` ? ' · ' + a.name : ''}`, value: a.id }))])
const typeChips = computed(() => { const n = (v: string[]) => (facets.value?.types || []).filter((t: any) => v.includes(t.value)).reduce((a: number, t: any) => a + t.n, 0); return [{ label: 'Alles', value: '' }, { label: `Marken ${n(['stamp', 'block', 'booklet', 'stamp_set', 'cover'])}`, value: 'stamps' }, { label: `Münzen ${n(['coin', 'coin_set', 'banknote'])}`, value: 'coins' }] })
const sortItems = [{ label: 'Katalognummer', value: 'michel' }, { label: 'Zuletzt erfasst', value: 'newest' }, { label: 'Jahr', value: 'year' }, { label: 'Katalogwert', value: 'value' }]
const hasFilter = computed(() => f.q || f.area || f.type || f.series || f.condition !== ALL || f.status !== ALL || f.albumId !== ALL || f.sheet)
function reset() { Object.assign(f, { q: '', area: '', type: '', series: '', condition: ALL, status: ALL, albumId: ALL, sheet: '' }) }
const selected = reactive(new Set<string>())
const toggle = (id: string) => selected.has(id) ? selected.delete(id) : selected.add(id)
const allSelected = computed(() => !!data.value?.items?.length && data.value.items.every((i: any) => selected.has(i.id)))
function toggleAll(v: boolean | 'indeterminate') { for (const i of data.value?.items || []) v === true ? selected.add(i.id) : selected.delete(i.id) }
const toast = useToast()
async function bulk(body: Record<string, unknown>) {
  await $fetch('/api/items/bulk', { method: 'POST', body: { ids: [...selected], ...body } })
  selected.clear(); await Promise.all([refresh(), refreshFacets()]); toast.add({ title: 'Gespeichert', color: 'success' })
}
async function askAlbum() {
  const albumNumber = Number(window.prompt('Album-Nummer?') || 0); if (!albumNumber) return
  const sheet = Number(window.prompt('Blatt-Nummer? (leer lassen für keine Änderung)') || 0)
  await bulk({ albumNumber, patch: sheet ? { sheet } : {} })
}
const estimating = ref(false)
async function bulkEstimate() {
  const ids = [...selected].slice(0, 15)
  if (!window.confirm(`KI-Preisschätzung für ${ids.length} Positionen starten? Das dauert einige Sekunden pro Position.`)) return
  estimating.value = true
  try { const r: any = await $fetch('/api/items/estimate-bulk', { method: 'POST', body: { ids } }); toast.add({ title: `${r.done} Schätzungen gespeichert${r.failed ? `, ${r.failed} fehlgeschlagen` : ''}`, color: r.failed ? 'warning' : 'success' }); selected.clear() }
  catch (e: any) { toast.add({ title: 'Schätzung fehlgeschlagen', description: e?.data?.statusMessage || e?.message, color: 'error' }) }
  finally { estimating.value = false }
}
async function bulkDelete() { if (window.confirm(`${selected.size} Positionen löschen?`)) await bulk({ delete: true }) }
</script>
