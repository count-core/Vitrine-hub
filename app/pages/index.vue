<template>
  <div class="flex flex-col gap-5">
    <div>
      <p class="text-sm text-stone-500">{{ today }}</p>
      <h1 class="font-display text-3xl font-extrabold">Hallo {{ me?.user?.name?.split(' ')[0] || '' }}</h1>
    </div>
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <NuxtLink to="/sammlung" class="relative col-span-2 flex min-h-36 flex-col justify-between overflow-hidden rounded-3xl bg-white p-4 shadow-sm dark:bg-stone-900">
        <span class="text-xs font-semibold text-stone-500">Sammlung</span>
        <div class="absolute right-3 top-3 flex">
          <StampImage v-for="(r, i) in (stats?.recent || []).slice(0, 3)" :key="r.id" :file-key="r.images?.[0]?.fileKey" :size="52" class="-ml-5 shadow-md first:ml-0" :style="{ transform: `rotate(${(i - 1) * 10}deg) translateY(${i === 1 ? 0 : 6}px)` }" />
        </div>
        <span class="font-display text-4xl font-extrabold tabular">{{ stats?.positions ?? 0 }} <span class="text-base font-semibold text-stone-500">Positionen · {{ stats?.pieces ?? 0 }} Marken</span></span>
        <span class="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900"><UIcon name="i-lucide-arrow-right" class="size-4" /></span>
      </NuxtLink>
      <div class="flex min-h-36 flex-col justify-between rounded-3xl bg-emerald-100 p-4 dark:bg-emerald-950">
        <span class="text-xs font-semibold text-stone-600 dark:text-stone-300">Katalogwert · privat</span>
        <span class="font-display text-2xl font-extrabold">{{ eur(stats?.catalogValue ?? 0) }}</span>
      </div>
      <div class="flex min-h-36 flex-col justify-between rounded-3xl bg-amber-100 p-4 dark:bg-amber-950">
        <span class="text-xs font-semibold text-stone-600 dark:text-stone-300">Gebiete</span>
        <div class="flex h-9 items-end gap-1">
          <i v-for="a in (stats?.byArea || []).slice(0, 6)" :key="a.area" class="flex-1 rounded-sm bg-stone-900/80 dark:bg-white/80" :style="{ height: barHeight(a.n) }" :title="`${a.area}: ${a.n}`" />
        </div>
        <span class="font-display text-2xl font-extrabold tabular">{{ stats?.areas ?? 0 }}</span>
      </div>
      <NuxtLink to="/erfassen" class="relative col-span-2 flex min-h-36 flex-col justify-between rounded-3xl bg-stone-900 p-4 text-white dark:bg-white dark:text-stone-900">
        <span class="text-xs font-semibold opacity-70">Erfassen</span>
        <span class="font-display pr-12 text-2xl font-extrabold">Albumblatt fotografieren,<br>Marken bestätigen, fertig.</span>
        <span class="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-orange-500 text-white"><UIcon name="i-lucide-camera" class="size-4" /></span>
      </NuxtLink>
      <NuxtLink to="/sammlung?status=duplicate" class="flex min-h-36 flex-col justify-between rounded-3xl bg-violet-100 p-4 dark:bg-violet-950">
        <span class="text-xs font-semibold text-stone-600 dark:text-stone-300">Dubletten</span>
        <span class="font-display text-2xl font-extrabold tabular">{{ stats?.duplicates ?? 0 }}</span>
      </NuxtLink>
      <NuxtLink to="/wunschliste?tab=scan" class="flex min-h-36 flex-col justify-between rounded-3xl bg-white p-4 dark:bg-stone-900">
        <span class="flex size-9 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"><UIcon name="i-lucide-scan-search" class="size-5" /></span>
        <span><b class="block font-display">Habe ich das schon?</b><small class="text-stone-500">Angebot fotografieren, Bestand prüfen</small></span>
      </NuxtLink>
      <NuxtLink to="/statistik" class="flex min-h-36 flex-col justify-between rounded-3xl bg-orange-100 p-4 dark:bg-orange-950">
        <span class="text-xs font-semibold text-stone-600 dark:text-stone-300">Statistik</span>
        <span class="text-sm font-semibold">Gebiete, Werte, Erhaltung, Verlauf</span>
        <span class="self-end flex size-8 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900"><UIcon name="i-lucide-chart-bar" class="size-4" /></span>
      </NuxtLink>
    </div>
    <section class="flex flex-col gap-2">
      <h2 class="text-xs font-bold uppercase tracking-wider text-stone-500">Zuletzt erfasst</h2>
      <div v-if="!stats?.recent?.length" class="rounded-2xl bg-white p-6 text-center text-stone-500 dark:bg-stone-900">Noch nichts erfasst. <NuxtLink to="/erfassen" class="font-semibold underline">Jetzt anfangen</NuxtLink>.</div>
      <NuxtLink v-for="r in stats?.recent || []" :key="r.id" :to="`/sammlung/${r.id}`" class="flex items-center gap-3 rounded-2xl bg-white p-2 pr-3 dark:bg-stone-900">
        <StampImage :file-key="r.images?.[0]?.fileKey" :size="44" />
        <span class="min-w-0 flex-1 text-sm"><b class="block truncate font-semibold">{{ catalogRef(r) || r.faceValue }} · {{ r.motif }}</b><small class="text-stone-500">{{ r.area }} {{ r.year }}<span v-if="r.album"> · Album {{ r.album.number }}, Blatt {{ r.sheet }}</span></small></span>
        <ConditionBadge :value="r.condition" />
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { data: me } = useMe()
const { data: stats } = await useFetch('/api/stats')
const { eur } = useLabels()
const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
/** Wurzelskala, damit kleine Gebiete neben einem großen noch sichtbar bleiben. */
function barHeight(n: number) {
  const m = maxArea.value || 1
  return `${Math.max(7, Math.round(Math.sqrt(Math.max(0, n) / m) * 36))}px`
}
const maxArea = computed(() => Math.max(1, ...(stats.value?.byArea || []).map((a: any) => a.n)))
</script>
