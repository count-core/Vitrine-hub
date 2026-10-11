<template>
  <UBadge :color="c.color" variant="soft" size="sm" class="font-mono">{{ c.symbol }}<span v-if="withLabel" class="ml-1 font-sans font-medium">{{ c.label }}</span></UBadge>
</template>

<script setup lang="ts">
const props = defineProps<{ value: string, withLabel?: boolean }>()
const { cond } = useLabels()
const c = computed(() => cond(props.value))
</script>
