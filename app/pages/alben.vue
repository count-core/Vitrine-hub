<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-end justify-between gap-2">
      <h1 class="font-display text-3xl font-extrabold">Alben</h1>
      <UButton icon="i-lucide-plus" label="Album anlegen" color="neutral" variant="soft" @click="create" />
    </div>
    <div v-if="!albums?.length" class="rounded-2xl bg-white p-10 text-center text-stone-500 dark:bg-stone-900">Noch keine Alben. Beim Erfassen wird das Album automatisch angelegt.</div>
    <div v-for="a in albums" :key="a.id" class="rounded-3xl bg-white p-4 dark:bg-stone-900">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="font-display text-xl font-extrabold">Album {{ a.number }}</span>
        <span v-if="ownName(a)" class="min-w-0 truncate text-stone-500">{{ a.name }}</span>
        <span class="text-sm text-stone-500 tabular">{{ a.items }} Positionen</span>
        <span class="hidden flex-1 sm:block" />
        <span class="ml-auto flex shrink-0 gap-1">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Album ${a.number} benennen`" @click="startEdit(a)" />
          <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" :aria-label="`Album ${a.number} löschen`" @click="remove(a)" />
        </span>
      </div>
      <div v-if="editing === a.id" class="mt-2 flex gap-2">
        <UInput v-model="draft" autofocus placeholder="Name des Albums, z. B. Deutschland 1949–1990" class="w-full" @keyup.enter="saveName(a)" />
        <UButton label="Speichern" @click="saveName(a)" />
        <UButton label="Abbrechen" color="neutral" variant="ghost" @click="editing = ''" />
      </div>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <UButton v-for="s in a.sheets" :key="s" :to="`/sammlung?albumId=${a.id}&sheet=${s}`" size="sm" color="neutral" variant="soft" :label="`Blatt ${s}`" />
        <UButton :to="`/sammlung?albumId=${a.id}`" size="sm" color="neutral" variant="link" label="Alle anzeigen" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { data: albums, refresh } = await useFetch<any[]>('/api/albums')
async function create() { const n = Number(window.prompt('Nummer des neuen Albums?') || 0); if (!n) return; await $fetch('/api/albums', { method: 'POST', body: { number: n } }); await refresh() }
/** Namen ausblenden, die nur die Nummer wiederholen (Altbestand). */
const ownName = (a: any) => a.name && a.name.trim() !== `Album ${a.number}`
const editing = ref(''), draft = ref('')
function startEdit(a: any) { editing.value = a.id; draft.value = ownName(a) ? a.name : '' }
async function saveName(a: any) { await $fetch(`/api/albums/${a.id}`, { method: 'PATCH', body: { name: draft.value.trim() } }); editing.value = ''; await refresh() }
async function remove(a: any) { if (!window.confirm(`Album ${a.number} löschen? Positionen bleiben erhalten, verlieren aber die Album-Zuordnung.`)) return; await $fetch(`/api/albums/${a.id}`, { method: 'DELETE' }); await refresh() }
</script>
