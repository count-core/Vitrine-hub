<template>
  <div class="flex max-w-md flex-col gap-4">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <h1 class="flex items-center gap-2 font-display text-3xl font-extrabold">Sortieren <InfoTip k="sort.swipe" /></h1>
        <span class="ml-auto shrink-0 whitespace-nowrap rounded-full bg-stone-200 px-2.5 py-1 text-sm font-semibold tabular text-stone-600 dark:bg-stone-800 dark:text-stone-300">{{ remaining }} offen</span>
      </div>
      <p class="text-sm text-stone-500">Wischen: links Dublette, rechts verkaufen, hoch behalten.</p>
    </div>
    <div class="flex gap-1"><i v-for="n in 20" :key="n" class="h-1.5 flex-1 rounded-full" :class="n <= Math.round(progress * 20) ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'" /></div>
    <div class="relative h-[440px]" @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd" @mousedown="onStart" @mousemove="onMove" @mouseup="onEnd" @mouseleave="onEnd">
      <div v-for="(it, i) in stack" :key="it.id" class="absolute inset-0 flex select-none flex-col items-center justify-center gap-3 rounded-3xl bg-white p-5 text-center shadow-xl dark:bg-stone-900" :style="cardStyle(i)">
        <StampImage :file-key="it.images?.[0]?.fileKey" :size="150" variant="web" />
        <h3 class="font-display text-xl font-extrabold">{{ catalogRef(it) || it.faceValue }} · {{ it.motif }}</h3>
        <p class="text-sm text-stone-500">{{ [it.area, it.year].filter(Boolean).join(' ') }} · {{ isCoin(it.type) ? it.grade || 'Erhaltung?' : cond(it.condition).label }} · {{ it.quantity }} Stück<span v-if="it.album"> · Album {{ it.album.number }}<span v-if="it.sheet">, Blatt {{ it.sheet }}</span></span></p>
        <div v-if="i === 0 && dx" class="absolute top-6 rounded-lg px-3 py-1 text-lg font-extrabold uppercase" :class="dx < 0 ? 'left-6 -rotate-12 bg-red-100 text-red-700' : 'right-6 rotate-12 bg-emerald-100 text-emerald-700'">{{ dx < 0 ? 'Dublette' : 'Verkaufen' }}</div>
      </div>
      <div v-if="!stack.length && !pending" class="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white p-6 text-center dark:bg-stone-900"><UIcon name="i-lucide-check-circle" class="size-10 text-emerald-500" /><b>Alles gesichtet.</b><span class="text-sm text-stone-500">{{ data?.reviewed }} Positionen entschieden. Entscheidungen lassen sich in der Sammlung jederzeit ändern.</span></div>
    </div>
    <div class="flex items-center justify-center gap-4">
      <button class="flex size-16 flex-col items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-700 shadow-lg dark:bg-stone-900" :disabled="!stack.length" @click="decide('duplicate')"><span class="text-xl">✕</span>Dublette</button>
      <button class="flex size-20 flex-col items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white shadow-lg dark:bg-white dark:text-stone-900" :disabled="!stack.length" @click="decide('keep')"><span class="text-2xl">♥</span>Behalten</button>
      <button class="flex size-16 flex-col items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-700 shadow-lg dark:bg-stone-900" :disabled="!stack.length" @click="decide('sell')"><span class="text-xl">€</span>Verkaufen</button>
    </div>
    <UButton v-if="last" label="Letzte Entscheidung zurücknehmen" color="neutral" variant="link" @click="undo" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { cond } = useLabels()
const toast = useToast()
const { data, pending, refresh } = await useFetch<any>('/api/items/unreviewed')
const stack = computed<any[]>(() => (data.value?.items || []).slice(0, 3))
const remaining = computed(() => data.value?.total ?? 0)
const progress = computed(() => { const t = (data.value?.total ?? 0) + (data.value?.reviewed ?? 0); return t ? (data.value?.reviewed ?? 0) / t : 0 })
const dx = ref(0), dy = ref(0), dragging = ref(false), startX = ref(0), startY = ref(0), leaving = ref<string | null>(null)
const last = ref<any>(null)
function pt(e: any) { return 'touches' in e && e.touches.length ? e.touches[0] : e }
function onStart(e: any) { if (!stack.value.length) return; dragging.value = true; startX.value = pt(e).clientX; startY.value = pt(e).clientY }
function onMove(e: any) { if (!dragging.value) return; dx.value = pt(e).clientX - startX.value; dy.value = pt(e).clientY - startY.value }
function onEnd() { if (!dragging.value) return; dragging.value = false; if (dx.value < -90) decide('duplicate'); else if (dx.value > 90) decide('sell'); else if (dy.value < -110) decide('keep'); dx.value = 0; dy.value = 0 }
function cardStyle(i: number) {
  if (i === 0) { const t = leaving.value === 'duplicate' ? 'translateX(-140%) rotate(-18deg)' : leaving.value === 'sell' ? 'translateX(140%) rotate(18deg)' : leaving.value === 'keep' ? 'translateY(-130%)' : `translate(${dx.value}px, ${dy.value}px) rotate(${dx.value / 18}deg)`; return { transform: t, transition: dragging.value ? 'none' : 'transform .35s cubic-bezier(.2,.8,.2,1)', zIndex: 3 } }
  return { transform: `scale(${1 - i * 0.05}) translateY(${i * 14}px)`, opacity: 1 - i * 0.3, zIndex: 3 - i }
}
async function decide(d: 'keep' | 'duplicate' | 'sell') {
  const it = stack.value[0]; if (!it || leaving.value) return
  leaving.value = d
  try { await $fetch(`/api/items/${it.id}/review`, { method: 'POST', body: { decision: d } }); last.value = it }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  setTimeout(async () => { await refresh(); leaving.value = null }, 320)
}
async function undo() { if (!last.value) return; await $fetch(`/api/items/${last.value.id}/review`, { method: 'POST', body: { decision: 'undo' } }); last.value = null; await refresh() }
</script>
