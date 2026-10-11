<template>
  <div class="flex flex-col gap-4">
    <div><h1 class="font-display text-3xl font-extrabold">Sätze und Serien</h1><p class="text-sm text-stone-500">Alles, was eine Serie oder einen Satz eingetragen hat, gruppiert. Die KI schlägt die Serie beim Erfassen vor.</p></div>
    <p v-if="!data?.length" class="rounded-2xl bg-white p-8 text-center text-stone-500 dark:bg-stone-900">Noch keine Serien. Trage bei Positionen das Feld "Serie / Satz" ein.</p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink v-for="s in data" :key="s.series" :to="`/saetze/${encodeURIComponent(s.series)}`" class="flex items-center gap-3 rounded-2xl bg-white p-3 dark:bg-stone-900">
        <img v-if="s.captureKey" :src="`/api/files/${s.captureKey}`" alt="" class="size-16 shrink-0 rounded-lg object-cover" loading="lazy"><StampImage v-else :file-key="s.image" :size="52" />
        <span class="min-w-0 flex-1 text-sm"><b class="block truncate">{{ s.series }}</b><small class="text-stone-500">{{ s.area }} {{ s.years }} · {{ s.positions }} Positionen, {{ s.pieces }} Stück<span v-if="s.value"> · {{ eur(s.value) }}</span></small><small class="block text-stone-400">{{ s.types.split(',').map(t => type(t)).join(', ') }}</small></span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { eur, type } = useLabels()
const { data } = await useFetch<any[]>('/api/series')
</script>
