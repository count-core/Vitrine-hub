<template>
  <span class="stamp-edge inline-block" :style="{ width: size + 'px' }">
    <img v-if="fileKey" :src="imgUrl(fileKey, variant)" :alt="alt" class="block h-auto w-full" loading="lazy">
    <span v-else class="flex items-center justify-center bg-stone-200 text-stone-400 dark:bg-stone-700" :style="{ width: (size - 8) + 'px', height: Math.round((size - 8) * 1.2) + 'px' }">
      <UIcon name="i-lucide-image" class="size-5" />
    </span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ fileKey?: string | null, size?: number, variant?: 'web' | 'thumb', alt?: string }>(), { size: 80, variant: 'thumb', alt: '' })
const { imgUrl } = useLabels()
</script>
