<template>
  <section v-if="d" class="flex flex-col gap-3 rounded-3xl bg-white p-5 dark:bg-stone-900">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xs font-bold uppercase tracking-wider text-stone-500">Aufnahme · ganzes Blatt</h2>
      <span class="text-xs text-stone-500">{{ new Date(d.capture.createdAt).toLocaleDateString('de-DE') }} · {{ d.items.length }} Positionen aus diesem Foto<span v-if="album"> · Album {{ album.number }}<span v-if="sheet">, Blatt {{ sheet }}</span></span></span>
    </div>
    <SheetImage v-slot="{ boxStyle }" :src="`/api/files/${d.capture.fileKey}`" alt="Gesamtaufnahme" :max-height="zoom ? undefined : 460" wrap-class="cursor-zoom-in" @click="zoom = !zoom">
      <NuxtLink v-for="it in withBox" :key="it.id" :to="`/sammlung/${it.id}`" class="group absolute rounded border-2 transition" :class="it.id === currentId ? 'z-10 border-orange-400 shadow-[0_0_0_3px_rgba(0,0,0,.5)]' : 'border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,.35)] hover:z-10 hover:border-white hover:bg-white/15'" :style="boxStyle(it.box)" :title="label(it)" @click.stop>
        <!-- Nummer nur an der aktuellen Position und beim Darüberfahren, sonst überlappen sie sich bei vielen Marken -->
        <span class="absolute bottom-full left-0 mb-0.5 rounded px-1 text-[10px] font-bold leading-tight transition-opacity" :class="it.id === currentId ? 'bg-orange-400 text-stone-900' : 'bg-white text-stone-900 opacity-0 group-hover:opacity-100'">{{ it.position }}</span>
      </NuxtLink>
    </SheetImage>
    <p class="text-xs text-stone-500">Aktuelle Position orange markiert. Bild antippen zum Vergrößern, Rahmen antippen für die jeweilige Position.</p>
    <div v-if="others.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <NuxtLink v-for="it in shown" :key="it.id" :to="`/sammlung/${it.id}`" class="flex items-center gap-2 rounded-xl bg-stone-100 p-2 text-xs dark:bg-stone-800">
        <StampImage :file-key="it.images?.[0]?.fileKey" :size="34" />
        <span class="min-w-0"><b class="block truncate">{{ it.position }} · {{ catalogRef(it) || it.faceValue }}</b><span class="block truncate text-stone-500">{{ it.motif }}</span></span>
      </NuxtLink>
    </div>
    <UButton v-if="others.length > shown.length || expanded" size="xs" color="neutral" variant="ghost" class="self-start" :label="expanded ? 'Weniger zeigen' : `Alle ${others.length} Positionen dieses Blatts zeigen`" @click="expanded = !expanded" />
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ captureId: string, currentId: string }>()
const { data: d } = await useFetch<any>(`/api/captures/${props.captureId}`)
const zoom = ref(false)
const others = computed(() => (d.value?.items || []).filter((i: any) => i.id !== props.currentId))
const current = computed(() => (d.value?.items || []).find((i: any) => i.id === props.currentId))
const album = computed(() => current.value?.album), sheet = computed(() => current.value?.sheet)
const expanded = ref(false)
const shown = computed(() => expanded.value ? others.value : others.value.slice(0, 11))
const withBox = computed(() => (d.value?.items || []).filter((i: any) => Array.isArray(i.box) && i.box.length === 4))
const label = (it: any) => `${it.position}: ${it.michelNo || it.faceValue} ${it.motif}`
</script>
