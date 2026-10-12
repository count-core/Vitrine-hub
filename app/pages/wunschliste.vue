<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="flex items-center gap-2 font-display text-3xl font-extrabold">Wunschliste <InfoTip k="wish.list" /></h1>
        <p class="text-sm text-stone-500">Was noch fehlt: von Hand eintragen, aus Lücken der Sammlung ermitteln oder beim Kauf prüfen.</p>
      </div>
      <UButton v-if="tab === 'list'" icon="i-lucide-plus" :label="open ? 'Formular schließen' : 'Wunsch eintragen'" @click="open = !open" />
    </div>

    <div class="flex gap-1 overflow-x-auto rounded-full bg-white p-1 dark:bg-stone-900">
      <button v-for="t in tabs" :key="t.value" type="button" class="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition" :class="tab === t.value ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'" @click="tab = t.value">
        <UIcon :name="t.icon" class="size-4" />{{ t.label }}
        <UBadge v-if="t.value === 'list' && count" size="sm" :color="tab === t.value ? 'neutral' : 'primary'" variant="soft">{{ count }}</UBadge>
      </button>
    </div>

    <template v-if="tab === 'list'">
      <div v-if="open" class="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 dark:bg-stone-900 sm:grid-cols-3">
        <UFormField label="Typ"><USelect v-model="f.type" :items="typeItems" class="w-full" /></UFormField>
        <UFormField label="Sammelgebiet"><UInputMenu v-model="f.area" :items="isCoin(f.type) ? AREAS_COINS : AREAS" create-item class="w-full" @create="f.area = $event" /></UFormField>
        <UFormField :label="catalogLabel(f.type)"><template #hint><InfoTip k="item.catalog" /></template><UInput v-model="f.michelNo" class="w-full font-mono" /></UFormField>
        <UFormField label="Jahr"><UInput v-model="f.year" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Serie / Satz"><UInput v-model="f.series" class="w-full" /></UFormField>
        <UFormField label="Gewünschte Erhaltung"><USelect v-model="f.condition" :items="condItems" class="w-full" /></UFormField>
        <UFormField label="Motiv / Beschreibung" class="col-span-2"><UInput v-model="f.motif" class="w-full" /></UFormField>
        <UFormField label="Zielpreis €"><template #hint><InfoTip k="wish.radar" /></template><UInput v-model="f.wantedMaxPrice" inputmode="decimal" class="w-full font-mono" /></UFormField>
        <UFormField label="Notiz" class="col-span-2 sm:col-span-3"><UInput v-model="f.publicNote" placeholder="z. B. auch als Satz willkommen" class="w-full" /></UFormField>
        <div class="col-span-2 flex gap-2 sm:col-span-3"><UButton label="Speichern" :loading="saving" @click="save" /><UButton label="Abbrechen" color="neutral" variant="ghost" @click="open = false" /></div>
      </div>

      <p v-if="!items.length" class="rounded-2xl bg-white p-8 text-center text-stone-500 dark:bg-stone-900">Noch keine Wünsche. Trage von Hand ein, was fehlt, oder lass unter „Lücken finden" deine Sammlung prüfen.</p>
      <div v-else class="flex flex-col gap-2">
        <WishCard v-for="it in items" :key="it.id" :it="it" @got="gotIt" @remove="remove" @changed="refresh()" />
      </div>
    </template>

    <WishGaps v-else-if="tab === 'gaps'" @added="onAdded" />
    <WishScan v-else @added="onAdded" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const toast = useToast()
const tabs = [
  { value: 'list', label: 'Meine Wünsche', icon: 'i-lucide-heart' },
  { value: 'gaps', label: 'Lücken finden', icon: 'i-lucide-puzzle' },
  { value: 'scan', label: 'Habe ich das?', icon: 'i-lucide-scan-search' },
]
const route = useRoute()
const tab = ref((['list', 'gaps', 'scan'].includes(String(route.query.tab)) ? String(route.query.tab) : 'list'))
watch(tab, t => navigateTo({ query: t === 'list' ? {} : { tab: t } }, { replace: true }))

const { data, refresh } = await useFetch<any>('/api/items', { query: { status: 'wanted', limit: 200, sort: 'newest' } })
const items = computed(() => data.value?.items || [])
const count = computed(() => items.value.length)

const condItems = CONDITIONS.slice(0, 4).map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value as string }))
const typeItems = TYPES.map(t => ({ label: t.label, value: t.value as string }))
const open = ref(false), saving = ref(false)
const f = reactive({ type: 'stamp', area: 'Bund', michelNo: '', year: '', series: '', motif: '', condition: 'mnh', wantedMaxPrice: '', publicNote: '' })

async function save() {
  if (!f.michelNo && !f.motif) { toast.add({ title: 'Katalognummer oder Motiv angeben', color: 'warning' }); return }
  saving.value = true
  try {
    await $fetch('/api/items', { method: 'POST', body: { ...f, status: 'wanted', quantity: 1 } })
    Object.assign(f, { michelNo: '', year: '', series: '', motif: '', wantedMaxPrice: '', publicNote: '' })
    open.value = false; await refresh()
    toast.add({ title: 'Wunsch eingetragen', description: 'Foto und Zielpreis kannst du direkt an der Karte ergänzen.', color: 'success' })
  } finally { saving.value = false }
}
async function gotIt(it: any) {
  await $fetch(`/api/items/${it.id}`, { method: 'PATCH', body: { status: 'collection' } })
  toast.add({ title: 'In die Sammlung übernommen', description: 'Lagerort auf der Positionsseite ergänzen.', color: 'success' })
  await refresh()
}
async function remove(it: any) {
  if (!window.confirm('Wunsch löschen?')) return
  await $fetch(`/api/items/${it.id}`, { method: 'DELETE' }); await refresh()
}
async function onAdded() { await refresh() }
</script>
