<template>
  <div class="flex max-w-xl flex-col gap-4">
    <h1 class="font-display text-3xl font-extrabold">Einstellungen</h1>
    <AiProviderSettings @saved="refreshMe()" />
    <section class="flex flex-col gap-3 rounded-3xl bg-white p-5 dark:bg-stone-900">
      <h2 class="text-xs font-bold uppercase tracking-wider text-stone-500">Öffentliche Sammlung</h2>
      <UFormField label="Sichtbarkeit"><template #hint><InfoTip k="settings.visibility" /></template><USelect v-model="pub.visibility" :items="visItems" class="w-full" /></UFormField>
      <template v-if="pub.visibility !== 'private'">
        <UFormField label="Kurzlink" :description="pub.slug ? `${origin}/s/${pub.slug}` : ''"><template #hint><InfoTip k="settings.slug" /></template><UInput v-model="pub.slug" placeholder="z. B. papas-sammlung" class="w-full font-mono" /></UFormField>
        <UFormField label="Titel"><UInput v-model="pub.publicTitle" placeholder="Deutschland 1949 bis 1990" class="w-full" /></UFormField>
        <UFormField label="Angezeigter Name"><UInput v-model="pub.publicName" placeholder="Sammler W." class="w-full" /></UFormField>
        <UFormField label="Einleitung"><UTextarea v-model="pub.publicIntro" :rows="3" placeholder="Was sammelst du, was suchst du, was tauschst du?" class="w-full" /></UFormField>
        <UCheckbox v-model="pub.showWanted" label="Wunschliste als 'Gesucht' zeigen" />
        <UCheckbox v-model="pub.allowInquiries" label="Anfragen und Preisvorschläge erlauben" />
      </template>
      <p class="text-xs text-stone-500">Öffentlich sichtbar sind nur Gebiet, Nummer, Jahr, Motiv, Erhaltung, Menge, Status und Beschreibung. Lagerort, Preise und private Notizen bleiben verborgen. "Nur Link": nicht für Suchmaschinen.</p>
      <div class="flex flex-wrap gap-2">
        <UButton label="Speichern" :loading="savingPub" @click="savePub" />
        <UButton v-if="pub.visibility !== 'private' && me?.collection?.slug" :to="`/s/${me.collection.slug}`" target="_blank" color="neutral" variant="soft" label="Öffentliche Seite öffnen" />
        <UButton to="/anfragen" color="neutral" variant="soft" label="Anfragen" />
      </div>
    </section>
    <section class="rounded-3xl bg-white p-5 dark:bg-stone-900">
      <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Hilfe</h2>
      <p class="text-sm">Was die App kann und wie das Erfassen aussieht, zeigt die Seite <NuxtLink to="/so-funktionierts" class="font-semibold underline">So funktioniert's</NuxtLink>. Die kleinen Info-Zeichen <UIcon name="i-lucide-info" class="inline-block size-4 align-text-bottom text-stone-400" /> in der App erklären einzelne Felder.</p>
    </section>
    <section class="rounded-3xl bg-white p-5 dark:bg-stone-900">
      <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Daten</h2>
      <UButton label="Sammlung als CSV exportieren" icon="i-lucide-download" color="neutral" variant="soft" to="/api/export/csv" external />
    </section>
    <section class="rounded-3xl bg-white p-5 dark:bg-stone-900">
      <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Konto</h2>
      <p class="text-sm">{{ me?.user?.name }} · {{ me?.user?.email }}</p>
      <UButton label="Abmelden" color="neutral" variant="soft" class="mt-3" @click="logout" />
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { data: me, refresh: refreshMe } = useMe()
const toast = useToast()
const origin = useRequestURL().origin
const visItems = [{ label: 'Privat (nur wir)', value: 'private' }, { label: 'Nur per Link', value: 'link' }, { label: 'Öffentlich', value: 'public' }]
const pub = reactive({ visibility: 'private', slug: '', publicTitle: '', publicName: '', publicIntro: '', showWanted: true, allowInquiries: true })
watch(me, (v) => { if (v?.collection) Object.assign(pub, { visibility: v.collection.visibility, slug: v.collection.slug || '', publicTitle: v.collection.publicTitle || '', publicName: v.collection.publicName || '', publicIntro: v.collection.publicIntro || '', showWanted: v.collection.showWanted ?? true, allowInquiries: v.collection.allowInquiries ?? true }) }, { immediate: true })
const savingPub = ref(false)
async function savePub() {
  savingPub.value = true
  try { await $fetch('/api/collection', { method: 'PATCH', body: { ...pub, slug: pub.slug || undefined } }); await refreshMe(); toast.add({ title: 'Gespeichert', color: 'success' }) }
  catch (e: any) { toast.add({ title: e?.data?.statusMessage || 'Fehler', color: 'error' }) }
  finally { savingPub.value = false }
}
async function logout() { await signOut(); clearSessionUser(); await navigateTo('/login') }
</script>
