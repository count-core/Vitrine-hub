<template>
  <div class="relative" @mouseleave="hover = -1">
    <svg :viewBox="`0 0 ${W} ${H}`" class="block h-auto w-full" role="img" :aria-label="label">
      <line v-for="t in ticks" :key="t" :x1="0" :x2="W" :y1="y(t)" :y2="y(t)" stroke="var(--grid)" stroke-width="1" />
      <text v-for="t in ticks" :key="'t' + t" :x="0" :y="y(t) - 3" style="font-size:11px">{{ t }}</text>
      <line :x1="0" :x2="W" :y1="y(0)" :y2="y(0)" stroke="var(--axis)" />
      <g v-for="(d, i) in data" :key="d.key" @mouseenter="hover = i" @touchstart.passive="hover = i">
        <rect :x="x(i)" :y="0" :width="slot" :height="H" fill="transparent" />
        <rect :x="x(i) + (slot - bw) / 2" :y="y(d.value)" :width="bw" :height="Math.max(0, y(0) - y(d.value))" rx="4" :fill="i === hover ? 'var(--ink)' : 'var(--s1)'" />
        <text :x="x(i) + slot / 2" :y="H - 4" text-anchor="middle" style="font-size:11px">{{ d.key }}</text>
        <text v-if="d.value === max" :x="x(i) + slot / 2" :y="y(d.value) - 4" text-anchor="middle" fill="var(--ink)" style="font-size:12px;font-weight:700">{{ d.value }}</text>
      </g>
    </svg>
    <div v-if="hover >= 0 && data[hover]" class="tip" :style="{ left: ((x(hover) + slot / 2) / W * 100) + '%', top: (y(data[hover].value) / H * 100) + '%' }">{{ data[hover].key }}: {{ data[hover].value }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ data: { key: string, value: number }[], label: string }>()
const W = 420, H = 170, top = 16, bottom = 18
const slot = computed(() => W / Math.max(1, props.data.length))
const bw = computed(() => Math.min(24, slot.value * 0.6))
const max = computed(() => Math.max(1, ...props.data.map(d => d.value)))
const nice = computed(() => { const m = max.value; const p = Math.pow(10, Math.floor(Math.log10(m))); return Math.ceil(m / p) * p })
const ticks = computed(() => [0, nice.value / 2, nice.value].map(v => Math.round(v)))
const y = (v: number) => H - bottom - (v / nice.value) * (H - top - bottom)
const x = (i: number) => i * slot.value
const hover = ref(-1)
</script>
