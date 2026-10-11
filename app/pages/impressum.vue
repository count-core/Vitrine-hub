<template>
  <div class="flex max-w-2xl flex-col gap-5">
    <NuxtLink to="/" class="font-display flex w-fit items-center gap-2 text-2xl font-extrabold"><span class="inline-block size-4 rounded bg-orange-500" />{{ cfg.appName }}</NuxtLink>
    <h1 class="font-display text-3xl font-extrabold">Impressum</h1>
    <UAlert v-if="!legal.name" color="warning" variant="soft" title="Betreiberangaben fehlen" description="Der Betreiber dieser Installation hat LEGAL_NAME, LEGAL_ADDRESS und LEGAL_EMAIL noch nicht gesetzt. Für einen öffentlichen Betrieb in Deutschland sind diese Angaben Pflicht (§ 5 DDG)." />
    <section class="rounded-3xl bg-white p-5 text-sm leading-relaxed dark:bg-stone-900">
      <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Angaben gemäß § 5 DDG</h2>
      <p class="whitespace-pre-line"><b>{{ legal.name || '[Name des Betreibers]' }}</b>
{{ legal.address || '[Straße, Hausnummer\nPLZ Ort]' }}</p>
      <p class="mt-3"><b>Kontakt</b><br>E-Mail: {{ legal.email || '[E-Mail-Adresse]' }}<span v-if="legal.phone"><br>Telefon: {{ legal.phone }}</span></p>
      <p v-if="legal.vatId" class="mt-3"><b>Umsatzsteuer-ID</b><br>{{ legal.vatId }}</p>
      <p class="mt-3"><b>Verantwortlich für den Inhalt</b> nach § 18 Abs. 2 MStV: {{ legal.name || '[Name]' }}, Anschrift wie oben.</p>
    </section>
    <section class="rounded-3xl bg-white p-5 text-sm leading-relaxed dark:bg-stone-900">
      <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Hinweise</h2>
      <p>Diese Seite ist eine private Sammlungsdatenbank. Öffentliche Sammlungen sind Schauseiten ohne Verkaufsabsicht; Anfragen und Preisvorschläge über die Seite sind unverbindlich und begründen keinen Vertrag.</p>
      <p class="mt-2">Katalognummern (Michel, Jaeger) sind Angaben der Sammler und keine Übernahme von Kataloginhalten. Genannte Marken und Katalogwerke gehören ihren jeweiligen Inhabern.</p>
      <p class="mt-2">Die Software ist quelloffen<span v-if="cfg.repoUrl">: <a :href="cfg.repoUrl" class="underline" target="_blank" rel="noopener">{{ cfg.repoUrl }}</a></span>, MIT-Lizenz, ohne Gewähr.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const cfg = useRuntimeConfig().public
const legal = cfg.legal
useSeoMeta({ title: `Impressum · ${cfg.appName}`, robots: 'noindex,follow' })
</script>
