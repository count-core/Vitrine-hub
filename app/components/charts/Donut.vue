<template>
  <div class="flex flex-wrap items-center gap-5">
    <div class="relative shrink-0" @mouseleave="hover = -1">
      <svg viewBox="0 0 120 120" class="block size-36" role="img" :aria-label="label">
        <circle cx="60" cy="60" r="44" fill="none" stroke="var(--grid)" stroke-width="16" />
        <circle v-for="(s, i) in segs" :key="s.key" cx="60" cy="60" r="44" fill="none" :stroke="`var(--s${(i % 5) + 1})`" stroke-width="16" :stroke-dasharray="`${s.len} ${C - s.len}`" :stroke-dashoffset="-s.off" transform="rotate(-90 60 60)" :opacity="hover < 0 || hover === i ? 1 : .35" @mouseenter="hover = i" @touchstart.passive="hover = i" />
        <text x="60" y="56" text-anchor="middle" fill="var(--ink)" style="font-size:20px;font-weight:700">{{ hs ? hs.value : total }}</text>
        <text x="60" y="72" text-anchor="middle" style="font-size:10px">{{ hs ? hs.key : unit }}</text>
      </svg>
    </div>
    <ul class="flex min-w-40 flex-col gap-1.5 text-sm">
      <li v-for="(s, i) in segs" :key="s.key" class="flex items-center gap-2" @mouseenter="hover = i" @mouseleave="hover = -1">
        <i class="inline-block size-2.5 rounded-full" :style="{ background: `var(--s${(i % 5) + 1})` }" /><span class="flex-1">{{ s.key }}</span><b class="tabular">{{ s.value }}</b><span class="w-10 text-right text-xs text-stone-500 tabular">{{ Math.round(s.value / total * 100) }} %</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ data: { key: string, value: number }[], label: string, unit: string }>()
const C = 2 * Math.PI * 44, GAP = 2
const total = computed(() => props.data.reduce((a, d) => a + d.value, 0) || 1)
const segs = computed(() => { let off = 0; return props.data.filter(d => d.value > 0).slice(0, 5).map(d => { const len = Math.max(0, d.value / total.value * C - GAP); const s = { ...d, len, off }; off += len + GAP; return s }) })
const hover = ref(-1)
const hs = computed(() => hover.value >= 0 ? segs.value[hover.value] : undefined)
</script>
