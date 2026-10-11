<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3"><UButton icon="i-lucide-chevron-left" size="lg" color="neutral" variant="soft" to="/saetze" aria-label="Zurück zur Satzübersicht" /><div><h1 class="font-display text-2xl font-extrabold">{{ name }}</h1><p class="text-sm text-stone-500">{{ items.length }} Positionen · {{ pieces }} Stück<span v-if="value"> · Katalogwert {{ eur(value) }}</span></p></div></div>
    <section v-for="cap in captures" :key="cap.id" class="flex flex-col gap-2 rounded-3xl bg-white p-4 dark:bg-stone-900">
      <h2 class="text-xs font-bold uppercase tracking-wider text-stone-500">Gesamtbild · {{ cap.items.length }} Stücke</h2>
      <SheetImage v-slot="{ boxStyle }" :src="`/api/files/${cap.fileKey}`" alt="Gesamtaufnahme" :max-height="560">
        <NuxtLink v-for="it in cap.items.filter((x: any) => x.box)" :key="it.id" :to="`/sammlung/${it.id}`" class="group absolute rounded border-2 border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,.35)] hover:z-10 hover:border-orange-400 hover:bg-white/15" :style="boxStyle(it.box)" :title="it.motif"><span class="absolute bottom-full left-0 mb-0.5 rounded bg-white px-1 text-[10px] font-bold leading-tight text-stone-900 opacity-0 transition-opacity group-hover:opacity-100">{{ it.position }}</span></NuxtLink>
      </SheetImage>
    </section>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"><ItemCard v-for="it in items" :key="it.id" :item="it" /></div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { eur } = useLabels()
const name = decodeURIComponent(useRoute().params.name as string)
const { data } = await useFetch<any>('/api/items', { query: { series: name, limit: 200, sort: 'year' } })
const items = computed(() => data.value?.items || [])
const pieces = computed(() => items.value.reduce((a: number, i: any) => a + i.quantity, 0))
const value = computed(() => items.value.reduce((a: number, i: any) => a + Number(i.catalogValue || 0) * i.quantity, 0))
const capIds = computed(() => [...new Set(items.value.map((i: any) => i.captureId).filter(Boolean))] as string[])
const { data: caps } = await useAsyncData(`caps-${name}`, async () => Promise.all(capIds.value.map(id => $fetch<any>(`/api/captures/${id}`).catch(() => null))), { watch: [capIds] })
const captures = computed(() => (caps.value || []).filter(Boolean).map((c: any) => ({ id: c.capture.id, fileKey: c.capture.fileKey, items: c.items })))
</script>
