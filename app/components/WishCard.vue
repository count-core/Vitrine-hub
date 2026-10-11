<template>
  <div class="flex flex-col gap-3 rounded-2xl bg-white p-3 dark:bg-stone-900">
    <div class="flex items-start gap-3">
      <label class="relative shrink-0 cursor-pointer" :title="it.images?.length ? 'Foto ersetzen' : 'Foto aufnehmen oder wählen'">
        <StampImage :file-key="it.images?.[0]?.fileKey" :size="56" />
        <span v-if="!it.images?.length" class="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50/80 text-stone-400 dark:border-stone-700 dark:bg-stone-800/80"><UIcon name="i-lucide-camera" class="size-5" /></span>
        <span v-if="uploading" class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 dark:bg-stone-900/70"><UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" /></span>
        <input type="file" accept="image/*" multiple class="hidden" @change="upload">
      </label>
      <div class="min-w-0 flex-1">
        <b class="block truncate text-sm">{{ title }}</b>
        <span class="block truncate text-xs text-stone-500">{{ subtitle }}</span>
        <div class="mt-1 flex flex-wrap items-center gap-1">
          <UBadge v-if="it.series" size="sm" color="neutral" variant="soft">{{ it.series }}</UBadge>
          <UBadge size="sm" color="neutral" variant="soft">{{ cond(it.condition).symbol }} {{ cond(it.condition).label }}</UBadge>
          <UBadge v-if="it.wantedMaxPrice" size="sm" :color="verdict.color" variant="soft">bis {{ eur(it.wantedMaxPrice) }}</UBadge>
        </div>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1">
        <UButton size="xs" color="neutral" variant="soft" label="Erhalten" title="In die Sammlung übernehmen" @click="$emit('got', it)" />
        <div class="flex">
          <UButton size="xs" color="neutral" variant="ghost" :icon="open ? 'i-lucide-chevron-up' : 'i-lucide-radar'" :aria-label="open ? 'Preisradar schließen' : 'Preisradar öffnen'" @click="toggle" />
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-x" aria-label="Wunsch löschen" @click="$emit('remove', it)" />
        </div>
      </div>
    </div>

    <div v-if="open" class="flex flex-col gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
      <div class="flex flex-wrap items-center gap-2">
        <span class="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-500">Preisradar <InfoTip k="wish.radar" /></span>
        <span class="flex-1" />
        <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-sparkles" :label="estimating ? 'schätzt …' : 'KI-Preis'" :loading="estimating" @click="estimate" />
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-white p-2 dark:bg-stone-900">
          <span class="block text-[11px] text-stone-500">Zielpreis</span>
          <UInput v-model="target" size="xs" inputmode="decimal" placeholder="—" class="mt-1 w-full text-center font-mono" @blur="saveTarget" @keyup.enter="saveTarget" />
        </div>
        <div class="rounded-lg bg-white p-2 dark:bg-stone-900">
          <span class="block text-[11px] text-stone-500">Beobachtet</span>
          <b class="mt-1 block font-mono text-sm">{{ p?.summary.median != null ? eur(p.summary.median) : '—' }}</b>
          <small class="text-[11px] text-stone-400">{{ p?.summary.count || 0 }} Preise</small>
        </div>
        <div class="rounded-lg bg-white p-2 dark:bg-stone-900">
          <span class="block text-[11px] text-stone-500">KI-Schätzung</span>
          <b class="mt-1 block font-mono text-sm">{{ p?.summary.aiEstimate != null ? eur(p.summary.aiEstimate) : '—' }}</b>
          <small class="text-[11px] text-stone-400">ohne Marktdaten</small>
        </div>
      </div>
      <p class="rounded-lg px-2 py-1.5 text-xs" :class="verdictClass">{{ verdict.text }}</p>
      <div v-if="p?.links" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span class="text-stone-500">Suchen:</span>
        <a v-for="(url, name) in linkList" :key="name" :href="url" target="_blank" rel="noopener" class="font-semibold underline decoration-dotted">{{ name }}</a>
      </div>
      <p v-if="it.publicNote" class="text-xs text-stone-500">{{ it.publicNote }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ it: any }>()
const emit = defineEmits<{ got: [it: any], remove: [it: any], changed: [] }>()
const { cond, eur } = useLabels()
const toast = useToast()

const title = computed(() => {
  return [catalogRef(props.it), props.it.motif].filter(Boolean).join(' · ') || 'Ohne Nummer'
})
const subtitle = computed(() => [props.it.area, props.it.year, props.it.faceValue].filter(Boolean).join(' · '))

const open = ref(false)
const p = ref<any>(null)
async function toggle() {
  open.value = !open.value
  if (open.value && !p.value) await load()
}
async function load() { p.value = await $fetch(`/api/items/${props.it.id}/prices`).catch(() => null) }

const LINK_LABELS: Record<string, string> = { ebaySold: 'eBay verkauft', ebayActive: 'eBay aktuell', delcampe: 'Delcampe', philasearch: 'Philasearch', maShops: 'MA-Shops', catawiki: 'Catawiki', colnect: 'Colnect' }
const linkList = computed<Record<string, string>>(() => {
  const l = p.value?.links || {}
  return Object.fromEntries(Object.entries(l).map(([k, v]) => [LINK_LABELS[k] || k, v as string]))
})

const target = ref(props.it.wantedMaxPrice ? String(props.it.wantedMaxPrice) : '')
watch(() => props.it.wantedMaxPrice, v => { target.value = v ? String(v) : '' })
async function saveTarget() {
  const raw = target.value.replace(',', '.').trim()
  const v = raw === '' ? null : Number(raw)
  if (v != null && !Number.isFinite(v)) { toast.add({ title: 'Zielpreis ist keine Zahl', color: 'warning' }); return }
  if (String(props.it.wantedMaxPrice ?? '') === String(v ?? '')) return
  await $fetch(`/api/items/${props.it.id}`, { method: 'PATCH', body: { wantedMaxPrice: v } })
  emit('changed')
}

/** Vergleicht Zielpreis mit dem, was der Markt oder die KI sagt. */
const verdict = computed(() => {
  const t = Number(String(props.it.wantedMaxPrice ?? '').replace(',', '.'))
  const ref_ = p.value?.summary.median ?? p.value?.summary.aiEstimate ?? null
  if (!Number.isFinite(t) || t <= 0) return { color: 'neutral' as const, text: 'Trag einen Zielpreis ein, dann vergleicht das Radar ihn mit beobachteten Preisen und der KI-Schätzung.' }
  if (ref_ == null) return { color: 'neutral' as const, text: `Zielpreis ${eur(t)}. Noch kein Vergleichswert: Suchlink öffnen und einen gefundenen Preis auf der Positionsseite eintragen, oder die KI schätzen lassen.` }
  if (ref_ <= t * 0.8) return { color: 'success' as const, text: `Gute Aussicht: Vergleichswert ${eur(ref_)} liegt deutlich unter deinem Ziel von ${eur(t)}.` }
  if (ref_ <= t) return { color: 'success' as const, text: `Im Rahmen: Vergleichswert ${eur(ref_)}, dein Ziel ${eur(t)}.` }
  if (ref_ <= t * 1.5) return { color: 'warning' as const, text: `Etwas über dem Ziel: Vergleichswert ${eur(ref_)} gegen ${eur(t)}. Geduld oder Ziel anheben.` }
  return { color: 'error' as const, text: `Deutlich zu teuer: Vergleichswert ${eur(ref_)} gegen dein Ziel von ${eur(t)}.` }
})
const verdictClass = computed(() => ({
  neutral: 'bg-white text-stone-500 dark:bg-stone-900',
  success: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  error: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
}[verdict.value.color]))

const estimating = ref(false)
async function estimate() {
  estimating.value = true
  try { await $fetch(`/api/items/${props.it.id}/estimate`, { method: 'POST' }); await load() }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Schätzung fehlgeschlagen', color: 'error' }) }
  finally { estimating.value = false }
}

const uploading = ref(false)
async function upload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  uploading.value = true
  try {
    const fd = new FormData()
    for (const f of Array.from(files).slice(0, 4)) fd.append('file', f)
    await $fetch(`/api/items/${props.it.id}/images`, { method: 'POST', body: fd })
    emit('changed')
  } catch (err: any) { toast.add({ title: err?.data?.statusMessage || 'Foto konnte nicht gespeichert werden', color: 'error' }) }
  finally { uploading.value = false; (e.target as HTMLInputElement).value = '' }
}
</script>
