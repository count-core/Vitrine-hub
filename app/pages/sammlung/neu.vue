<template>
  <div class="mx-auto flex max-w-xl flex-col gap-4">
    <div class="flex items-center gap-3"><UButton icon="i-lucide-chevron-left" color="neutral" variant="soft" to="/sammlung" aria-label="Zurück" /><h1 class="font-display text-2xl font-extrabold">Position von Hand anlegen</h1></div>
    <ItemForm v-model="form" />
    <UButton size="xl" block label="Anlegen" :loading="saving" @click="save" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const form = reactive<any>({ type: 'stamp', area: 'Bund', country: 'Deutschland', condition: 'mnh', grade: '', series: '', quantity: 1, status: 'collection' })
const saving = ref(false)
async function save() {
  saving.value = true
  const it: any = await $fetch('/api/items', { method: 'POST', body: form })
  saving.value = false
  await navigateTo(`/sammlung/${it.id}`)
}
</script>
