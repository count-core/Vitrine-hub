<template>
  <div class="flex flex-col gap-4">
    <section class="flex flex-col gap-3 rounded-2xl bg-white p-4 dark:bg-stone-900">
      <div>
        <h2 class="flex items-center gap-1.5 font-display text-lg font-extrabold">Habe ich das schon? <InfoTip k="wish.scan" /></h2>
        <p class="text-sm text-stone-500">Auf der Börse ein Angebot fotografieren. Die App gleicht jedes erkannte Stück mit deiner Sammlung und deiner Wunschliste ab. Es wird nichts gespeichert.</p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <UFormField label="Was liegt auf dem Foto?" class="w-48"><USelect v-model="mode" :items="modeItems" class="w-full" /></UFormField>
        <UFormField label="Gebiet-Hinweis" class="w-48"><UInputMenu v-model="hint" :items="AREAS" create-item class="w-full" @create="hint = $event" /></UFormField>
      </div>
      <label class="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-base font-bold text-white shadow-lg shadow-orange-500/30">
        <UIcon :name="pending ? 'i-lucide-loader-circle' : 'i-lucide-scan-search'" class="size-5" :class="pending ? 'animate-spin' : ''" />
        {{ pending ? 'prüft …' : 'Angebot fotografieren oder Foto wählen' }}
        <input type="file" accept="image/*" capture="environment" class="hidden" :disabled="pending" @change="scan">
      </label>
      <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{{ error }}</p>
    </section>

    <section v-if="r" class="flex flex-col gap-3 rounded-2xl bg-white p-4 dark:bg-stone-900">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="error" variant="soft">{{ r.summary.owned }} hast du</UBadge>
        <UBadge color="primary" variant="soft">{{ r.summary.wanted }} gesucht</UBadge>
        <UBadge color="neutral" variant="soft">{{ r.summary.new }} neu</UBadge>
        <span class="flex-1" />
        <span class="text-xs text-stone-500">{{ r.results.length }} erkannt · {{ (r.durationMs / 1000).toFixed(1) }} s</span>
      </div>

      <SheetImage v-slot="{ boxStyle }" :src="r.preview" alt="Geprüftes Angebot" :max-height="420">
        <div v-for="x in r.results.filter((s: any) => s.box)" :key="x.position" class="pointer-events-none absolute rounded border-2" :class="verdictBorder(x.verdict)" :style="boxStyle(x.box)">
          <span class="absolute bottom-full left-0 mb-0.5 hidden rounded px-1 text-[10px] font-bold leading-tight sm:inline-block" :class="verdictChip(x.verdict)">{{ x.position }}</span>
        </div>
      </SheetImage>
      <p class="text-xs text-stone-500"><span class="font-semibold text-red-500">Rot</span> hast du schon, <span class="font-semibold text-orange-500">Orange</span> steht auf der Wunschliste, <span class="font-semibold text-emerald-500">Grün</span> ist neu für die Sammlung.</p>

      <div class="flex flex-col gap-1.5">
        <div v-for="x in r.results" :key="x.position" class="flex items-center gap-2 rounded-xl p-2 text-sm" :class="verdictRow(x.verdict)">
          <UCheckbox v-if="x.verdict === 'new'" :model-value="sel.has(x.position)" @update:model-value="toggle(x.position)" />
          <span v-else class="w-4 shrink-0" />
          <span class="w-6 shrink-0 text-center font-mono text-xs text-stone-500">{{ x.position }}</span>
          <span class="min-w-0 flex-1">
            <b class="block truncate">{{ x.michelNo ? `Nr. ${x.michelNo}` : x.faceValue || 'ohne Nummer' }}<span v-if="x.motif"> · {{ x.motif }}</span></b>
            <span class="block truncate text-xs text-stone-500">{{ [x.area, x.year].filter(Boolean).join(' ') }} · {{ Math.round(x.confidence * 100) }} % sicher</span>
          </span>
          <NuxtLink v-if="x.itemId" :to="`/sammlung/${x.itemId}`" class="shrink-0 text-xs font-semibold underline">ansehen</NuxtLink>
          <span class="shrink-0 text-xs font-bold">{{ verdictText(x) }}</span>
        </div>
      </div>

      <div v-if="sel.size" class="flex flex-wrap items-center gap-2">
        <UFormField size="xs"><USelect v-model="wishCondition" :items="condItems" size="xs" class="w-36" /></UFormField>
        <UButton size="sm" :label="`${sel.size} auf die Wunschliste`" :loading="adding" @click="add" />
        <UButton size="sm" color="neutral" variant="ghost" label="Auswahl leeren" @click="sel.clear()" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ added: [] }>()
const toast = useToast()
const condItems = CONDITIONS.slice(0, 4).map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value as string }))
const modeItems = [{ label: 'Automatisch', value: 'auto' }, { label: 'Briefmarken', value: 'stamps' }, { label: 'Münzen', value: 'coins' }]

const mode = ref('auto'), hint = ref('')
const r = ref<any>(null), pending = ref(false), error = ref('')
const sel = reactive(new Set<number>())
const wishCondition = ref('mnh')
function toggle(p: number) { sel.has(p) ? sel.delete(p) : sel.add(p) }

async function scan(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  pending.value = true; error.value = ''; r.value = null; sel.clear()
  try {
    const fd = new FormData()
    fd.append('file', file); fd.append('mode', mode.value); if (hint.value) fd.append('hint', hint.value)
    r.value = await $fetch('/api/wishlist/scan', { method: 'POST', body: fd })
  } catch (err: any) { error.value = err?.data?.statusMessage || 'Prüfung fehlgeschlagen' }
  finally { pending.value = false; (e.target as HTMLInputElement).value = '' }
}

const verdictText = (x: any) => x.verdict === 'owned' ? `hast du${x.ownedQuantity > 1 ? ` ${x.ownedQuantity}×` : ''}` : x.verdict === 'wanted' ? 'gesucht' : 'neu'
const verdictBorder = (v: string) => v === 'owned' ? 'border-red-400 bg-red-500/15' : v === 'wanted' ? 'border-orange-400 bg-orange-500/15' : 'border-emerald-400 bg-emerald-500/15'
const verdictChip = (v: string) => v === 'owned' ? 'bg-red-400 text-white' : v === 'wanted' ? 'bg-orange-400 text-stone-900' : 'bg-emerald-400 text-stone-900'
const verdictRow = (v: string) => v === 'owned' ? 'bg-red-50 dark:bg-red-950/40' : v === 'wanted' ? 'bg-orange-50 dark:bg-orange-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'

const adding = ref(false)
async function add() {
  const entries = r.value.results.filter((x: any) => sel.has(x.position)).map((x: any) => ({ area: x.area, type: x.type, series: x.series, michelNo: x.michelNo, motif: x.motif, year: x.year, condition: wishCondition.value }))
  adding.value = true
  try {
    const res = await $fetch<{ added: number, skipped: number }>('/api/wishlist/from-gaps', { method: 'POST', body: { entries } })
    toast.add({ title: `${res.added} auf die Wunschliste`, color: 'success' })
    sel.clear(); emit('added')
  } catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  finally { adding.value = false }
}
</script>
