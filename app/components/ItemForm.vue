<template>
  <div class="grid grid-cols-2 gap-3">
    <UFormField label="Typ"><USelect v-model="m.type" :items="typeItems" class="w-full" /></UFormField>
    <UFormField label="Sammelgebiet"><UInputMenu v-model="m.area" :items="isCoin(m.type) ? AREAS_COINS : AREAS" create-item class="w-full" @create="m.area = $event" /></UFormField>
    <UFormField :label="catalogLabel(m.type)"><template #hint><InfoTip k="item.catalog" /></template><UInput v-model="m.michelNo" class="w-full font-mono" /></UFormField>
    <UFormField label="Jahr"><UInput v-model="m.year" type="number" class="w-full font-mono" /></UFormField>
    <UFormField label="Nennwert"><UInput v-model="m.faceValue" placeholder="25 Pf" class="w-full" /></UFormField>
    <UFormField label="Farbe"><UInput v-model="m.color" class="w-full" /></UFormField>
    <UFormField label="Motiv" class="col-span-2"><UInput v-model="m.motif" class="w-full" /></UFormField>
    <UFormField label="Serie / Satz" class="col-span-2"><template #hint><InfoTip k="item.series" /></template><UInput v-model="m.series" placeholder="z. B. Olympiade 1972, Kursmünzensatz 2020" class="w-full" /></UFormField>
    <template v-if="isCoin(m.type)">
      <UFormField label="Erhaltung (Münze)"><template #hint><InfoTip k="item.grade" /></template><USelect v-model="m.grade" :items="gradeItems" class="w-full" /></UFormField>
      <UFormField label="Prägestätte"><template #hint><InfoTip k="item.mint" /></template><UInput v-model="m.mint" placeholder="A, D, F, G, J" class="w-full font-mono" /></UFormField>
      <UFormField label="Material"><UInput v-model="m.material" placeholder="Silber 925" class="w-full" /></UFormField>
      <UFormField label="Durchmesser mm"><UInput v-model="m.diameterMm" inputmode="decimal" class="w-full font-mono" /></UFormField>
      <UFormField label="Gewicht g"><UInput v-model="m.weightG" inputmode="decimal" class="w-full font-mono" /></UFormField>
    </template>
    <UFormField v-if="!isCoin(m.type)" label="Erhaltung" class="col-span-2"><template #hint><InfoTip k="item.condition" /></template>
      <div class="grid grid-cols-4 gap-1.5">
        <button v-for="c in CONDITIONS.slice(0, 4)" :key="c.value" type="button" class="flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold" :class="m.condition === c.value ? 'border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'" @click="m.condition = c.value">
          <span class="font-mono">{{ c.symbol }}</span><small class="text-[10px] font-medium opacity-70">{{ c.label }}</small>
        </button>
      </div>
    </UFormField>
    <UFormField label="Menge"><template #hint><InfoTip k="item.quantity" /></template><UInputNumber v-model="m.quantity" :min="1" class="w-full" /></UFormField>
    <UFormField label="Status"><template #hint><InfoTip k="item.status" /></template><USelect v-model="m.status" :items="statusItems" class="w-full" /></UFormField>
    <UFormField label="Album-Nr."><UInput v-model="m.albumNumber" type="number" class="w-full font-mono" /></UFormField>
    <UFormField label="Blatt"><UInput v-model="m.sheet" type="number" class="w-full font-mono" /></UFormField>
    <UFormField label="Katalogwert € · privat"><template #hint><InfoTip k="item.catalogValue" /></template><UInput v-model="m.catalogValue" inputmode="decimal" class="w-full font-mono" /></UFormField>
    <UFormField label="Schätzwert € · privat"><template #hint><InfoTip k="item.estValue" /></template><UInput v-model="m.estValue" inputmode="decimal" class="w-full font-mono" /></UFormField>
    <UFormField label="Private Notiz" class="col-span-2"><UTextarea v-model="m.privateNote" :rows="2" class="w-full" /></UFormField>
    <UFormField label="Öffentliche Beschreibung" class="col-span-2"><template #hint><InfoTip k="item.publicNote" /></template><UTextarea v-model="m.publicNote" :rows="2" class="w-full" /></UFormField>
  </div>
</template>

<script setup lang="ts">
const m = defineModel<any>({ required: true })
const typeItems = TYPES.map(t => ({ label: t.label, value: t.value }))
const statusItems = STATUSES.map(s => ({ label: s.label, value: s.value }))
const gradeItems = [{ label: 'unbekannt', value: 'none' }, ...GRADES.map(g => ({ label: g === 'PP' ? 'PP Polierte Platte' : g === 'st' ? 'st Stempelglanz' : g === 'vz' ? 'vz vorzüglich' : g === 'ss' ? 'ss sehr schön' : 's schön', value: g }))]
watch(() => m.value.grade, v => { if (v === 'none') m.value.grade = '' })
if (m.value.grade === '') m.value.grade = 'none'
</script>
