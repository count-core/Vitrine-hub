<template>
  <section class="flex flex-col gap-3 rounded-3xl bg-white p-5 dark:bg-stone-900">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">Preisrecherche <InfoTip k="price.links" /></h2>
      <span class="flex items-center gap-1.5">
        <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-sparkles" :label="estimating ? 'KI schätzt …' : 'KI-Schätzung'" :loading="estimating" @click="estimate" />
        <InfoTip k="price.ai" />
      </span>
    </div>
    <div v-if="d?.summary" class="grid grid-cols-3 gap-2">
      <div class="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800"><span class="text-[11px] font-semibold text-stone-500">Beobachtet</span><b class="block text-lg">{{ d.summary.count }}</b></div>
      <div class="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800"><span class="text-[11px] font-semibold text-stone-500">Median</span><b class="block text-lg">{{ d.summary.median != null ? eur(d.summary.median) : '–' }}</b><small class="text-xs text-stone-500">{{ d.summary.min != null ? `${eur(d.summary.min)} bis ${eur(d.summary.max)}` : '' }}</small></div>
      <div class="rounded-2xl bg-stone-100 p-3 dark:bg-stone-800"><span class="text-[11px] font-semibold text-stone-500">KI-Schätzung</span><b class="block text-lg">{{ d.summary.aiEstimate != null ? eur(d.summary.aiEstimate) : '–' }}</b><small class="text-xs text-stone-500">ohne Quellen</small></div>
    </div>
    <div v-if="d?.summary && (d.summary.median != null || d.summary.aiEstimate != null)" class="flex flex-wrap gap-2">
      <UButton size="xs" color="neutral" variant="soft" label="Median als Schätzwert übernehmen" :disabled="d.summary.median == null" @click="$emit('apply', { estValue: d.summary.median })" />
      <UButton size="xs" color="neutral" variant="soft" label="KI-Schätzung übernehmen" :disabled="d.summary.aiEstimate == null" @click="$emit('apply', { estValue: d.summary.aiEstimate })" />
    </div>
    <div class="flex flex-wrap gap-1.5 text-sm">
      <span class="text-stone-500">Suchen:</span>
      <a v-for="l in linkList" :key="l.label" :href="l.href" target="_blank" rel="noopener" class="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800">{{ l.label }}</a>
    </div>
    <details class="rounded-2xl border border-dashed border-stone-300 p-3 dark:border-stone-700" :open="openForm">
      <summary class="cursor-pointer text-sm font-semibold">Gefundenen Preis eintragen</summary>
      <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <UFormField label="Quelle"><USelect v-model="f.source" :items="sources" class="w-full" /></UFormField>
        <UFormField label="Art"><USelect v-model="f.kind" :items="kinds" class="w-full" /></UFormField>
        <UFormField label="Preis €"><UInput v-model="f.price" inputmode="decimal" class="w-full font-mono" /></UFormField>
        <UFormField label="Erhaltung"><USelect v-model="f.condition" :items="condItems" class="w-full" /></UFormField>
        <UFormField label="Datum"><UInput v-model="f.observedAt" type="date" class="w-full" /></UFormField>
        <UFormField label="Link"><UInput v-model="f.url" placeholder="https://…" class="w-full" /></UFormField>
        <UFormField label="Notiz" class="col-span-2 sm:col-span-3"><UInput v-model="f.note" class="w-full" /></UFormField>
      </div>
      <UButton class="mt-3" label="Speichern" size="sm" :loading="saving" @click="save" />
    </details>
    <ul v-if="d?.rows?.length" class="divide-y divide-stone-100 text-sm dark:divide-stone-800">
      <li v-for="r in d.rows" :key="r.id" class="flex items-start gap-3 py-2">
        <UIcon :name="r.kind === 'ai_estimate' ? 'i-lucide-sparkles' : r.kind === 'sold' ? 'i-lucide-badge-check' : 'i-lucide-eye'" class="mt-0.5 size-4 shrink-0 text-stone-400" />
        <span class="min-w-0 flex-1"><b>{{ r.price != null ? eur(r.price) : '–' }}<span v-if="r.priceMax"> bis {{ eur(r.priceMax) }}</span></b> <span class="text-stone-500">· {{ r.source }}<span v-if="r.condition"> · {{ cond(r.condition).symbol }}</span> · {{ new Date(r.observedAt).toLocaleDateString('de-DE') }}<span v-if="r.confidence"> · {{ Math.round(Number(r.confidence) * 100) }} % sicher</span></span><small v-if="r.note" class="block text-stone-500">{{ r.note }}</small><a v-if="r.url" :href="r.url" target="_blank" rel="noopener" class="text-xs underline">Quelle öffnen</a></span>
        <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" aria-label="Löschen" @click="remove(r.id)" />
      </li>
    </ul>
    <p v-else class="text-sm text-stone-500">Noch keine Preise. Öffne einen Suchlink, trage gefundene Verkaufspreise ein, oder lass die KI schätzen.</p>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ itemId: string }>()
const emit = defineEmits<{ apply: [patch: Record<string, unknown>], changed: [] }>()
const { eur, cond } = useLabels()
const toast = useToast()
const { data: d, refresh } = await useFetch<any>(`/api/items/${props.itemId}/prices`)
const linkList = computed(() => d.value?.links ? [
  { label: 'eBay verkauft', href: d.value.links.ebaySold }, { label: 'eBay aktuell', href: d.value.links.ebayActive }, { label: 'Delcampe', href: d.value.links.delcampe },
  { label: d.value.links.philasearch.includes('ma-shops') ? 'MA-Shops' : 'Philasearch', href: d.value.links.philasearch }, { label: 'Catawiki', href: d.value.links.catawiki }, { label: 'Colnect', href: d.value.links.colnect },
] : [])
const sources = ['eBay', 'Delcampe', 'Philasearch', 'MA-Shops', 'Catawiki', 'Händler', 'Auktion', 'Michel-Katalog', 'Jaeger-Katalog', 'Sonstige']
const kinds = [{ label: 'Angebot gesehen', value: 'observed' }, { label: 'Tatsächlich verkauft', value: 'sold' }, { label: 'Katalogwert', value: 'catalog' }]
const condItems = [{ label: 'wie Position', value: 'inherit' }, ...CONDITIONS.slice(0, 4).map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value }))]
const openForm = ref(false), saving = ref(false), estimating = ref(false)
const f = reactive({ source: 'eBay', kind: 'observed', price: '', condition: 'inherit', observedAt: new Date().toISOString().slice(0, 10), url: '', note: '' })
async function save() {
  saving.value = true
  try { await $fetch(`/api/items/${props.itemId}/prices`, { method: 'POST', body: { ...f, condition: f.condition === 'inherit' ? undefined : f.condition } }); f.price = ''; f.url = ''; f.note = ''; await refresh(); emit('changed'); toast.add({ title: 'Preis gespeichert', color: 'success' }) }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  finally { saving.value = false }
}
async function estimate() {
  estimating.value = true
  try { const r: any = await $fetch(`/api/items/${props.itemId}/estimate`, { method: 'POST' }); await refresh(); emit('changed'); toast.add({ title: `KI-Schätzung ${Math.round(r.estimate.konfidenz * 100)} % sicher`, description: r.estimate.begruendung?.slice(0, 160), color: 'success' }) }
  catch (e: any) { toast.add({ title: 'KI-Schätzung fehlgeschlagen', description: e?.data?.statusMessage || e?.message, color: 'error' }) }
  finally { estimating.value = false }
}
async function remove(id: string) { await $fetch(`/api/prices/${id}`, { method: 'DELETE' }); await refresh(); emit('changed') }
</script>
