<template>
  <section class="viz flex flex-col gap-3 rounded-3xl bg-white p-4 dark:bg-stone-900">
    <div class="flex items-start justify-between gap-3">
      <div><h2 class="text-sm font-bold">{{ title }}</h2><p v-if="subtitle" class="text-xs text-stone-500">{{ subtitle }}</p></div>
      <button type="button" class="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-[11px] font-semibold text-stone-500 dark:border-stone-700" @click="table = !table">{{ table ? 'Diagramm' : 'Tabelle' }}</button>
    </div>
    <div v-if="!table"><slot /></div>
    <div v-else class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-[11px] uppercase tracking-wider text-stone-500"><th v-for="c in columns" :key="c" class="py-1 pr-3">{{ c }}</th></tr></thead><tbody><tr v-for="(r, i) in rows" :key="i" class="border-t border-stone-100 dark:border-stone-800"><td v-for="(v, j) in r" :key="j" class="py-1.5 pr-3" :class="j > 0 ? 'tabular' : ''">{{ v }}</td></tr></tbody></table></div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string, subtitle?: string, columns: string[], rows: (string | number)[][] }>()
const table = ref(false)
</script>

<style>
.viz { --s1: #2a78d6; --s2: #eb6834; --s3: #1baf7a; --s4: #eda100; --s5: #e87ba4; --grid: #e7e5e4; --axis: #d6d3d1; --muted: #78716c; --ink: #1c1917; --surface: #ffffff; position: relative; }
@media (prefers-color-scheme: dark) { :root:where(:not(.light)) .viz { --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; --s5: #d55181; --grid: #292524; --axis: #44403c; --muted: #a8a29e; --ink: #fafaf9; --surface: #1c1917; } }
:root.dark .viz { --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; --s5: #d55181; --grid: #292524; --axis: #44403c; --muted: #a8a29e; --ink: #fafaf9; --surface: #1c1917; }
.viz text { font-family: inherit; fill: var(--muted); font-size: 11px; }
.viz .tip { position: absolute; pointer-events: none; background: var(--ink); color: var(--surface); font-size: 12px; padding: 4px 8px; border-radius: 6px; white-space: nowrap; transform: translate(-50%, calc(-100% - 8px)); z-index: 5; }
</style>
