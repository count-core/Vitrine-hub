<template>
  <div v-if="d" class="mx-auto flex max-w-5xl flex-col gap-5">
    <header class="rounded-3xl bg-stone-900 p-6 text-white dark:bg-white dark:text-stone-900">
      <p class="text-xs font-semibold uppercase tracking-wider opacity-70">Öffentliche Sammlung</p>
      <h1 class="font-display mt-1 text-3xl font-extrabold">{{ d.collection.title }}</h1>
      <p v-if="d.collection.name" class="mt-1 text-sm opacity-80">von {{ d.collection.name }}</p>
      <p v-if="d.collection.intro" class="mt-3 max-w-2xl whitespace-pre-line text-sm opacity-90">{{ d.collection.intro }}</p>
      <div class="mt-4 flex flex-wrap gap-2 text-sm">
        <span class="rounded-full bg-white/15 px-3 py-1 dark:bg-stone-900/10">{{ d.items.length }} Positionen</span>
        <span v-if="d.wanted.length" class="rounded-full bg-white/15 px-3 py-1 dark:bg-stone-900/10">{{ d.wanted.length }} gesucht</span>
        <UButton v-if="d.collection.allowInquiries" size="sm" color="primary" label="Anfrage an den Sammler" @click="ask()" />
      </div>
    </header>

    <div class="flex flex-wrap gap-2">
      <UInput v-model="q" icon="i-lucide-search" placeholder="Michel-Nr., Motiv, Jahr …" class="w-full sm:w-72" />
      <UButton v-for="a in areas" :key="a" size="sm" :variant="area === a ? 'solid' : 'soft'" color="neutral" class="rounded-full" :label="a" @click="area = area === a ? '' : a" />
    </div>

    <section v-if="d.wanted.length" class="rounded-3xl border-2 border-dashed border-orange-300 p-4 dark:border-orange-800">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">Gesucht</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        <div v-for="w in d.wanted" :key="w.id" class="flex items-center gap-3 rounded-2xl bg-white p-3 dark:bg-stone-900">
          <span v-if="w.image" class="stamp-edge inline-block shrink-0" style="width:48px"><img :src="`/api/public/files/${w.image}-thumb.webp`" :alt="w.motif" class="block w-full" loading="lazy"></span>
          <span class="min-w-0 flex-1 text-sm"><b class="block truncate">{{ catalogRef(w) || w.motif }}<span v-if="w.michelNo && w.motif"> · {{ w.motif }}</span></b><small class="text-stone-500">{{ [w.area, w.year].filter(Boolean).join(' ') }} · {{ cond(w.condition).label }}<span v-if="w.wantedMaxPrice"> · bis {{ eur(w.wantedMaxPrice) }}</span></small></span>
          <UButton v-if="d.collection.allowInquiries" size="xs" color="primary" variant="soft" label="Ich habe das" @click="ask(w, 'have')" />
        </div>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div v-for="it in filtered" :key="it.id" class="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 dark:bg-stone-900">
        <span class="stamp-edge inline-block" style="width:88px"><img v-if="it.image" :src="`/api/public/files/${it.image}-thumb.webp`" :alt="it.motif" class="block w-full" loading="lazy"><span v-else class="flex h-24 w-20 items-center justify-center bg-stone-200 text-stone-400"><UIcon name="i-lucide-image" /></span></span>
        <span class="w-full text-sm"><b class="block truncate">{{ catalogRef(it) || it.faceValue }} <ConditionBadge :value="it.condition" /></b><small class="block truncate text-stone-500">{{ [it.area, it.year].filter(Boolean).join(' ') }} · {{ it.motif }}</small></span>
        <div class="flex w-full flex-wrap gap-1">
          <UBadge v-if="it.status === 'for_sale'" color="success" variant="soft" size="sm">zu verkaufen</UBadge>
          <UBadge v-if="it.status === 'duplicate'" color="neutral" variant="soft" size="sm">Dublette, Tausch möglich</UBadge>
          <UButton v-if="d.collection.allowInquiries" size="xs" color="neutral" variant="soft" class="ml-auto" label="Anfragen" @click="ask(it)" />
        </div>
      </div>
    </div>
    <p v-if="!filtered.length" class="py-8 text-center text-stone-500">Keine Treffer.</p>
    <footer class="py-4 text-center text-xs text-stone-500">Anfragen sind unverbindlich. Kauf, Tausch und Abwicklung laufen direkt zwischen den Beteiligten außerhalb dieser Seite.</footer>

    <UModal v-model:open="modal" :title="target ? (kind === 'have' ? 'Ich habe diese Marke' : 'Anfrage zur Position') : 'Anfrage an den Sammler'">
      <template #body>
        <div class="flex flex-col gap-3">
          <p v-if="target" class="text-sm text-stone-500">{{ catalogRef(target) || target.faceValue }} · {{ target.motif }}</p>
          <UFormField label="Dein Name"><UInput v-model="m.name" class="w-full" /></UFormField>
          <UFormField label="Deine E-Mail" required><UInput v-model="m.email" type="email" class="w-full" /></UFormField>
          <UFormField v-if="target && kind !== 'have'" label="Preisvorschlag € (optional)"><UInput v-model="m.offerPrice" inputmode="decimal" class="w-full font-mono" /></UFormField>
          <UFormField label="Nachricht" required><UTextarea v-model="m.message" :rows="4" class="w-full" /></UFormField>
          <input v-model="m.website" type="text" class="hidden" tabindex="-1" autocomplete="off">
          <p class="text-xs text-stone-500">Unverbindlich. Der Sammler antwortet per E-Mail. Deine Angaben werden nur dafür gespeichert.</p>
          <UButton label="Absenden" :loading="sending" @click="send" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const route = useRoute()
const { cond, eur } = useLabels()
const toast = useToast()
const { data: d, error } = await useFetch<any>(`/api/public/${route.params.slug}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Diese Sammlung ist nicht öffentlich.' })
useHead(() => ({ title: d.value ? `${d.value.collection.title} · Vitrine-Hub` : 'Sammlung', meta: [{ name: 'robots', content: d.value?.collection.visibility === 'public' ? 'index,follow' : 'noindex,nofollow' }] }))
const q = ref(''), area = ref('')
const areas = computed(() => [...new Set((d.value?.items || []).map((i: any) => i.area).filter(Boolean))] as string[])
const filtered = computed(() => (d.value?.items || []).filter((i: any) => (!area.value || i.area === area.value) && (!q.value || `${i.michelNo} ${i.motif} ${i.year} ${i.area} ${i.faceValue}`.toLowerCase().includes(q.value.toLowerCase()))))
const modal = ref(false), sending = ref(false), target = ref<any>(null), kind = ref('question')
const m = reactive({ name: '', email: '', message: '', offerPrice: '', website: '' })
function ask(it: any = null, k = 'question') { target.value = it; kind.value = it ? (k === 'have' ? 'have' : 'offer') : 'question'; modal.value = true }
async function send() {
  sending.value = true
  try { await $fetch(`/api/public/${route.params.slug}/inquiry`, { method: 'POST', body: { ...m, itemId: target.value?.id, kind: kind.value } }); modal.value = false; m.message = ''; m.offerPrice = ''; toast.add({ title: 'Anfrage gesendet', color: 'success' }) }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Senden fehlgeschlagen', color: 'error' }) }
  finally { sending.value = false }
}
</script>
