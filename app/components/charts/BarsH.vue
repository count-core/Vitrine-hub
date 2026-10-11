<template>
  <div class="flex flex-col gap-2.5">
    <!-- Bewusst HTML statt SVG: eine feste SVG-Breite staucht auf dem Handy Schrift und Balken. -->
    <div v-for="d in data" :key="d.key" class="flex flex-col gap-1">
      <div class="flex items-baseline justify-between gap-2 text-xs">
        <span class="min-w-0 truncate font-semibold text-stone-700 dark:text-stone-200">{{ d.key || 'ohne Angabe' }}</span>
        <span class="shrink-0 tabular text-stone-500">{{ fmt(d.value) }}<span v-if="d.extra" class="ml-1 hidden sm:inline">· {{ d.extra }}</span></span>
      </div>
      <div class="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div class="h-full rounded-full transition-[width]" :style="{ width: width(d.value), background: 'var(--s1)' }" />
      </div>
    </div>
    <p v-if="!data.length" class="py-6 text-center text-sm text-stone-500">Noch keine Daten.</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ data: { key: string, value: number, extra?: string }[], label: string, fmt?: (v: number) => string }>(), { fmt: (v: number) => String(v) })
const max = computed(() => Math.max(1, ...props.data.map(d => d.value)))
/** Mindestens ein sichtbarer Rest, damit kleine Werte nicht verschwinden. */
const width = (v: number) => `${Math.max(2, Math.round((v / max.value) * 100))}%`
</script>
