<template>
  <div v-if="it" class="flex max-w-3xl flex-col gap-5">
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-chevron-left" size="lg" color="neutral" variant="soft" to="/sammlung" aria-label="Zurück zur Sammlung" />
      <span class="text-sm text-stone-500">{{ it.area }} · {{ it.year }}</span>
      <span class="flex-1" />
      <UButton v-if="!editing" icon="i-lucide-pencil" label="Bearbeiten" color="neutral" variant="soft" @click="startEdit" />
      <template v-else><UButton label="Abbrechen" color="neutral" variant="ghost" @click="editing = false" /><UButton label="Speichern" :loading="saving" @click="save" /></template>
    </div>

    <div class="flex flex-col gap-4 rounded-3xl bg-white p-5 dark:bg-stone-900 sm:flex-row">
      <div class="flex flex-col items-center gap-2">
        <StampImage :file-key="primary?.fileKey" :size="180" variant="web" :alt="it.motif" />
        <div class="flex flex-wrap justify-center gap-1">
          <button v-for="im in it.images" :key="im.id" type="button" class="rounded border-2" :class="im.id === primary?.id ? 'border-orange-500' : 'border-transparent'" @click="setPrimary(im.id)"><StampImage :file-key="im.fileKey" :size="40" /></button>
          <label class="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 text-stone-400"><UIcon name="i-lucide-plus" /><input type="file" accept="image/*" multiple class="hidden" @change="upload"></label>
        </div>
        <UButton v-if="primary && it.images.length > 1" label="Bild entfernen" size="xs" variant="link" color="neutral" @click="removeImage(primary.id)" />
        <label v-if="isCoin(it.type) && it.images.length < 2" class="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200"><UIcon name="i-lucide-camera" class="size-4" />Rückseite fehlt, jetzt fotografieren<input type="file" accept="image/*" capture="environment" class="hidden" @change="upload"></label>
      </div>
      <div class="flex flex-1 flex-col gap-2">
        <h1 class="font-display text-2xl font-extrabold">{{ it.michelNo ? `${isCoin(it.type) ? 'J.' : 'Mi'} ${it.michelNo}` : (it.series || it.motif || 'Ohne Nummer') }}<span v-if="it.faceValue"> · {{ it.faceValue }}</span></h1>
        <p class="text-stone-600 dark:text-stone-300">{{ it.motif }}</p>
        <div class="flex flex-wrap gap-1.5"><UBadge v-if="isCoin(it.type) && it.grade" color="info" variant="soft">{{ it.grade }}</UBadge><ConditionBadge v-else :value="it.condition" with-label /><UBadge color="neutral" variant="soft">{{ type(it.type) }}</UBadge><UBadge color="neutral" variant="soft">{{ it.quantity }} Stück</UBadge><UBadge color="neutral" variant="soft">{{ status(it.status) }}</UBadge></div>
        <div v-if="it.aiConfidence" class="mt-1 rounded-xl border-l-4 border-orange-400 bg-stone-100 p-2 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">KI-Vorschlag mit {{ Math.round(Number(it.aiConfidence) * 100) }} % Konfidenz<span v-if="it.capture"> · {{ it.capture.provider }} {{ it.capture.model }}</span><span v-if="it.aiSuggestion?.hint"> · {{ it.aiSuggestion.hint }}</span></div>
      </div>
    </div>

    <ItemForm v-if="editing" v-model="form" />
    <template v-else>
      <section class="rounded-3xl bg-white p-1 px-5 dark:bg-stone-900">
        <dl class="divide-y divide-stone-100 text-sm dark:divide-stone-800">
          <div v-for="[k, v] in fields" :key="k" class="flex justify-between gap-4 py-3"><dt class="text-stone-500">{{ k }}</dt><dd class="text-right font-medium">{{ v || '–' }}</dd></div>
        </dl>
      </section>
      <section class="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 dark:border-stone-700 dark:bg-stone-900/50">
        <h2 class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500"><UIcon name="i-lucide-lock" class="size-3.5" />Nur für uns sichtbar</h2>
        <dl class="divide-y divide-stone-200 text-sm dark:divide-stone-800">
          <div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Lagerort</dt><dd class="font-medium">{{ it.album ? `Album ${it.album.number}` : '–' }}<span v-if="it.sheet">, Blatt {{ it.sheet }}</span><span v-if="it.position">, Pos. {{ it.position }}</span></dd></div>
          <div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Katalogwert</dt><dd class="font-medium tabular">{{ eur(it.catalogValue) || '–' }}</dd></div>
          <div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Schätzwert</dt><dd class="font-medium tabular">{{ eur(it.estValue) || '–' }}</dd></div>
          <div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Notiz</dt><dd class="text-right font-medium whitespace-pre-line">{{ it.privateNote || '–' }}</dd></div>
        </dl>
      </section>
      <section class="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-white p-4 text-sm dark:bg-stone-900">
        <UCheckbox :model-value="it.visibility !== 'hidden'" label="In der öffentlichen Sammlung zeigen" @update:model-value="patch({ visibility: $event ? 'inherit' : 'hidden' })" />
        <UButton v-if="it.status !== 'wanted'" size="xs" color="neutral" variant="soft" label="Auf die Wunschliste" @click="patch({ status: 'wanted' })" />
        <UButton v-else size="xs" color="neutral" variant="soft" label="Erhalten, in die Sammlung" @click="patch({ status: 'collection' })" />
      </section>
      <div class="flex flex-wrap gap-2">
        <UButton label="Als Dublette" color="neutral" variant="soft" @click="patch({ status: 'duplicate' })" />
        <UButton label="Zum Verkauf" color="neutral" variant="soft" @click="patch({ status: 'for_sale' })" />
        <span class="flex-1" />
        <UButton label="Löschen" color="error" variant="soft" @click="remove" />
      </div>
      <CapturePanel v-if="it.captureId" :capture-id="it.captureId" :current-id="it.id" />
      <PricePanel :item-id="it.id" @apply="patch" @changed="refresh" />
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { eur, type, status, cond } = useLabels()
const { data: it, refresh } = await useFetch<any>(`/api/items/${route.params.id}`)
const primary = computed(() => it.value?.images?.find((i: any) => i.isPrimary) || it.value?.images?.[0])
const fields = computed(() => it.value ? [
  ['Typ', type(it.value.type)], ['Sammelgebiet', it.value.area], ['Land', it.value.country], ['Jahr', it.value.year], [catalogLabel(it.value.type), it.value.michelNo], ['Nennwert', it.value.faceValue], ['Serie / Satz', it.value.series],
  ...(isCoin(it.value.type) ? [['Erhaltung', it.value.grade || '–'], ['Prägestätte', it.value.mint], ['Material', it.value.material], ['Durchmesser', it.value.diameterMm ? `${it.value.diameterMm} mm` : ''], ['Gewicht', it.value.weightG ? `${it.value.weightG} g` : '']] : [['Farbe', it.value.color], ['Erhaltung', `${cond(it.value.condition).symbol} ${cond(it.value.condition).label}`]]),
  ['Menge', it.value.quantity], ['Beschreibung', it.value.publicNote],
] : [])
const editing = ref(false), saving = ref(false)
const form = reactive<any>({})
function startEdit() { Object.assign(form, { ...it.value, albumNumber: it.value.album?.number ?? '' }); editing.value = true }
const toast = useToast()
async function patch(body: Record<string, unknown>) { await $fetch(`/api/items/${it.value.id}`, { method: 'PATCH', body }); await refresh(); toast.add({ title: 'Gespeichert', color: 'success' }) }
async function save() { saving.value = true; await patch(form); saving.value = false; editing.value = false }
async function remove() { if (!window.confirm('Position löschen?')) return; await $fetch(`/api/items/${it.value.id}`, { method: 'DELETE' }); await navigateTo('/sammlung') }
async function upload(e: Event) {
  const files = (e.target as HTMLInputElement).files; if (!files?.length) return
  const fd = new FormData(); for (const f of files) fd.append('file', f)
  await $fetch(`/api/items/${it.value.id}/images`, { method: 'POST', body: fd }); await refresh()
}
async function setPrimary(id: string) { await $fetch(`/api/images/${id}`, { method: 'PATCH' }); await refresh() }
async function removeImage(id: string) { await $fetch(`/api/images/${id}`, { method: 'DELETE' }); await refresh() }
</script>
