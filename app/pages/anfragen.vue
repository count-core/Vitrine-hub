<template>
  <div class="flex flex-col gap-4">
    <h1 class="font-display text-3xl font-extrabold">Anfragen <span v-if="data?.unread" class="rounded-full bg-orange-500 px-2 py-0.5 align-middle text-sm text-white">{{ data.unread }} neu</span></h1>
    <p v-if="!data?.rows?.length" class="rounded-2xl bg-white p-8 text-center text-stone-500 dark:bg-stone-900">Noch keine Anfragen. Sie kommen über deine öffentliche Sammlung herein.</p>
    <div v-for="r in data?.rows || []" :key="r.id" class="rounded-2xl bg-white p-4 dark:bg-stone-900" :class="r.readAt ? 'opacity-70' : 'ring-2 ring-orange-400'">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <UBadge :color="r.kind === 'have' ? 'success' : r.kind === 'offer' ? 'warning' : 'neutral'" variant="soft">{{ { question: 'Frage', offer: 'Preisvorschlag', have: 'Hat gesuchte Marke' }[r.kind] || r.kind }}</UBadge>
        <b>{{ r.name || 'Ohne Name' }}</b><a :href="`mailto:${r.email}`" class="underline">{{ r.email }}</a>
        <span class="text-stone-500">{{ new Date(r.createdAt).toLocaleString('de-DE') }}</span>
        <span v-if="r.offerPrice" class="font-semibold">{{ eur(r.offerPrice) }}</span>
        <span class="flex-1" />
        <UButton size="xs" color="neutral" variant="ghost" :label="r.readAt ? 'Als ungelesen' : 'Gelesen'" @click="mark(r)" />
        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-x" aria-label="Löschen" @click="remove(r)" />
      </div>
      <NuxtLink v-if="r.item" :to="`/sammlung/${r.item.id}`" class="mt-1 block text-sm text-stone-500 underline">{{ catalogRef(r.item) }} {{ r.item.motif }} · {{ r.item.area }} {{ r.item.year }}</NuxtLink>
      <p class="mt-2 whitespace-pre-line text-sm">{{ r.message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { eur } = useLabels()
const { data, refresh } = await useFetch<any>('/api/inquiries')
async function mark(r: any) { await $fetch(`/api/inquiries/${r.id}`, { method: 'PATCH', body: { read: !r.readAt } }); await refresh() }
async function remove(r: any) { if (!window.confirm('Anfrage löschen?')) return; await $fetch(`/api/inquiries/${r.id}`, { method: 'DELETE' }); await refresh() }
</script>
