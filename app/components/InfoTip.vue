<template>
  <UPopover :content="{ side: 'top', align: 'start', sideOffset: 6 }" :ui="{ content: 'max-w-xs rounded-xl p-3 text-sm leading-snug' }">
    <button type="button" class="-m-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" :aria-label="`Erklärung: ${h.title}`">
      <UIcon name="i-lucide-info" class="size-4" />
    </button>
    <template #content>
      <p class="mb-1 font-bold">{{ h.title }}</p>
      <p class="text-stone-600 dark:text-stone-300">{{ h.text }}</p>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{ k?: string, title?: string, text?: string }>()
const h = computed(() => props.k ? useHelp(props.k) : { title: props.title || '', text: props.text || '' })
</script>
