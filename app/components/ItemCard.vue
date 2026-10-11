<template>
  <NuxtLink :to="`/sammlung/${item.id}`" class="relative flex h-full flex-col items-center gap-2 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:shadow-md dark:bg-stone-900" :class="selected ? 'ring-2 ring-orange-500' : ''">
    <span v-if="item.quantity > 1" class="absolute right-2 top-2 rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-stone-900">×{{ item.quantity }}</span>
    <button v-if="selectable" type="button" class="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full border bg-white dark:bg-stone-800" :class="selected ? 'border-orange-500 bg-orange-500 text-white' : 'border-stone-300'" @click.prevent="$emit('toggle')">
      <UIcon v-if="selected" name="i-lucide-check" class="size-4" />
    </button>
    <span class="flex h-28 items-center justify-center"><StampImage :file-key="item.images?.[0]?.fileKey" :size="88" :alt="item.motif" /></span>
    <span class="mt-auto w-full text-sm">
      <b class="block truncate font-semibold">{{ catalogRef(item) || item.faceValue || 'ohne Nummer' }} <ConditionBadge :value="item.condition" /></b>
      <small class="block truncate text-stone-500">{{ [item.area, item.year].filter(Boolean).join(' ') }} · {{ item.motif || item.faceValue }}</small>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ item: any, selectable?: boolean, selected?: boolean }>()
defineEmits<{ toggle: [] }>()
</script>
