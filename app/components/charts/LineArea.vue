<template>
  <div class="relative" @mouseleave="hover = -1" @mousemove="onMove" @touchmove.passive="onMove">
    <svg :viewBox="`0 0 ${W} ${H}`" class="block h-auto w-full" role="img" :aria-label="label">
      <line v-for="t in ticks" :key="t" :x1="0" :x2="W" :y1="y(t)" :y2="y(t)" stroke="var(--grid)" />
      <text v-for="t in ticks" :key="'t' + t" :x="0" :y="y(t) - 3" style="font-size:11px">{{ t }}</text>
      <path v-if="pts.length" :d="area" fill="var(--s1)" opacity=".1" />
      <path v-if="pts.length" :d="line" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <template v-if="hp">
        <line :x1="hp.x" :x2="hp.x" :y1="top" :y2="H - bottom" stroke="var(--axis)" />
        <circle :cx="hp.x" :cy="hp.y" r="5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2" />
      </template>
      <circle v-else-if="lastPt" :cx="lastPt.x" :cy="lastPt.y" r="4" fill="var(--s1)" stroke="var(--surface)" stroke-width="2" />
      <text :x="0" :y="H - 4" style="font-size:11px">{{ data[0]?.key }}</text>
      <text v-if="data.length > 1" :x="W" :y="H - 4" text-anchor="end" style="font-size:11px">{{ data[data.length - 1]?.key }}</text>
    </svg>
    <div v-if="hp && hd" class="tip" :style="{ left: (hp.x / W * 100) + '%', top: (hp.y / H * 100) + '%' }">{{ hd.key }}: {{ hd.value }}</div>
    <p v-if="!data.length" class="py-6 text-center text-sm text-stone-500">Noch keine Daten.</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ data: { key: string, value: number }[], label: string }>()
const W = 420, H = 170, top = 14, bottom = 18
const max = computed(() => Math.max(1, ...props.data.map(d => d.value)))
const nice = computed(() => { const m = max.value; const p = Math.pow(10, Math.floor(Math.log10(m))); return Math.ceil(m / p) * p })
const ticks = computed(() => [0, nice.value / 2, nice.value].map(v => Math.round(v)))
const y = (v: number) => H - bottom - (v / nice.value) * (H - top - bottom)
const pts = computed(() => props.data.map((d, i) => ({ x: props.data.length > 1 ? i / (props.data.length - 1) * (W - 8) + 4 : W / 2, y: y(d.value) })))
const line = computed(() => pts.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '))
const area = computed(() => pts.value.length ? `${line.value} L${pts.value[pts.value.length - 1]!.x} ${y(0)} L${pts.value[0]!.x} ${y(0)} Z` : '')
const hover = ref(-1)
const hp = computed(() => hover.value >= 0 ? pts.value[hover.value] : undefined)
const hd = computed(() => hover.value >= 0 ? props.data[hover.value] : undefined)
const lastPt = computed(() => pts.value[pts.value.length - 1])
function onMove(e: MouseEvent | TouchEvent) {
  const el = (e.currentTarget as HTMLElement); const r = el.getBoundingClientRect(); const cx = 'touches' in e ? e.touches[0]!.clientX : e.clientX
  const rel = (cx - r.left) / r.width * W; let best = -1, bd = 1e9
  pts.value.forEach((p, i) => { const d = Math.abs(p.x - rel); if (d < bd) { bd = d; best = i } }); hover.value = best
}
</script>
