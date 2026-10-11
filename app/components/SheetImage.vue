<template>
  <div class="overflow-hidden rounded-2xl bg-stone-800" :class="wrapClass">
    <!-- w-fit: der Rahmen-Container ist exakt so groß wie das gerenderte Bild.
         Ohne das liegen die Positionsrahmen auf der vollen Containerbreite und damit neben dem Foto. -->
    <div class="relative mx-auto w-fit max-w-full">
      <img
        :src="src" :alt="alt" loading="lazy" decoding="async"
        class="block h-auto w-auto max-w-full"
        :style="maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : undefined"
        @load="onLoad"
      >
      <slot :box-style="boxStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ src: string, alt?: string, maxHeight?: number | string, wrapClass?: string }>()
const emit = defineEmits<{ load: [img: HTMLImageElement] }>()
const img = shallowRef<HTMLImageElement>()

function onLoad(e: Event) {
  img.value = e.target as HTMLImageElement
  emit('load', img.value)
}

/**
 * Wandelt eine KI-Box [ymin, xmin, ymax, xmax] (0..1000) in CSS-Prozente um.
 * Werte werden auf 0..1000 begrenzt, damit eine fehlerhafte Box nicht aus dem Bild ragt.
 */
function boxStyle(b?: number[] | null) {
  if (!b || b.length !== 4) return { display: 'none' }
  const c = (v: number) => Math.min(1000, Math.max(0, Number(v) || 0))
  const y1 = c(b[0]!), x1 = c(b[1]!), y2 = c(b[2]!), x2 = c(b[3]!)
  if (y2 <= y1 || x2 <= x1) return { display: 'none' }
  return { top: `${y1 / 10}%`, left: `${x1 / 10}%`, height: `${(y2 - y1) / 10}%`, width: `${(x2 - x1) / 10}%` }
}

defineExpose({ img })
</script>
