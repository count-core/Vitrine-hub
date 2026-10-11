<template>
  <div class="flex max-w-2xl flex-col gap-5">
    <NuxtLink to="/" class="font-display flex w-fit items-center gap-2 text-2xl font-extrabold"><span class="inline-block size-4 rounded bg-orange-500" />{{ cfg.appName }}</NuxtLink>
    <h1 class="font-display text-3xl font-extrabold">Datenschutz</h1>
    <p class="text-sm text-stone-500">Stand: {{ stand }}. Diese Erklärung beschreibt, welche Daten die Anwendung verarbeitet. Der Betreiber der Installation ist für die Angaben verantwortlich und passt sie bei Bedarf an.</p>
    <UAlert v-if="!legal.name" color="warning" variant="soft" title="Betreiberangaben fehlen" description="LEGAL_NAME, LEGAL_ADDRESS und LEGAL_EMAIL sind nicht gesetzt. Die verantwortliche Stelle wird unten als Platzhalter angezeigt." />

    <section v-for="s in sections" :key="s.h" class="rounded-3xl bg-white p-5 text-sm leading-relaxed dark:bg-stone-900">
      <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">{{ s.h }}</h2>
      <p v-for="(t, i) in s.p" :key="i" :class="i ? 'mt-2' : ''" class="whitespace-pre-line">{{ t }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const cfg = useRuntimeConfig().public
const legal = cfg.legal
useSeoMeta({ title: `Datenschutz · ${cfg.appName}`, robots: 'noindex,follow' })
const stand = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
const who = legal.name ? `${legal.name}\n${legal.address}\nE-Mail: ${legal.email}` : '[Name und Anschrift des Betreibers, E-Mail-Adresse]'
const sections = [
  { h: 'Verantwortliche Stelle', p: [who] },
  { h: 'Hosting und Server-Logs', p: ['Die Anwendung läuft auf einem Server des Betreibers. Beim Aufruf verarbeitet der Server technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser), um die Seite auszuliefern und Angriffe abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Logs werden nach kurzer Zeit gelöscht.'] },
  { h: 'Konto und Sammlungsdaten', p: ['Für die Nutzung ist ein Konto nötig (Name, E-Mail, Passwort als Hash). Die Sammlungsdaten (Positionen, Fotos, Preise, Notizen) speichert der Betreiber, um die Funktion der Anwendung bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO). Sie bleiben privat, solange die Sammlung nicht ausdrücklich veröffentlicht wird. Ein Konto kann jederzeit vom Betreiber gelöscht werden; damit werden die zugehörigen Daten entfernt.'] },
  { h: 'Cookies', p: ['Die Anwendung setzt nur ein technisch notwendiges Sitzungs-Cookie für die Anmeldung. Es gibt keine Tracking-Cookies, keine Werbung und keine Analyse-Dienste.'] },
  { h: 'KI-Erkennung', p: ['Beim Erfassen wird das hochgeladene Foto an den konfigurierten KI-Anbieter übermittelt, um Marken und Münzen zu erkennen. Welcher Anbieter das ist, zeigt die Anwendung unter Einstellungen → KI-Erkennung (Standard: Google Gemini über Google AI Studio, USA). Die Anbieter verarbeiten die Bilder nach ihren eigenen Bedingungen; im kostenlosen Tarif von Google können Eingaben zur Verbesserung der Modelle genutzt werden. Fotos sollten daher keine Personen oder Dokumente zeigen. Wer keine Übermittlung wünscht, kann in den Einstellungen ein lokales Modell (Ollama) hinterlegen.'] },
  { h: 'Öffentliche Sammlung und Anfragen', p: ['Nur wenn der Sammler eine Sammlung ausdrücklich veröffentlicht, sind Gebiet, Nummer, Jahr, Motiv, Erhaltung, Menge, Status, Beschreibung und Bilder für andere sichtbar. Lagerort, Preise und private Notizen bleiben immer verborgen.', 'Wer über eine öffentliche Sammlung eine Anfrage schickt, übermittelt Name (freiwillig), E-Mail-Adresse und Nachricht. Diese Daten werden gespeichert, damit der Sammler antworten kann (Art. 6 Abs. 1 lit. b DSGVO), und zur Missbrauchsabwehr zusammen mit einer gekürzten IP-Adresse. Sie werden gelöscht, sobald die Anfrage erledigt ist oder der Sammler sie löscht.'] },
  { h: 'Externe Links', p: ['Die Preisrecherche verlinkt auf Suchseiten von eBay, Delcampe, Philasearch, MA-Shops, Catawiki und Colnect. Erst beim Klick auf einen Link werden Daten an den jeweiligen Anbieter übertragen. Diese Anwendung bindet keine Inhalte dieser Anbieter ein.'] },
  { h: 'Deine Rechte', p: ['Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie das Recht, dich bei einer Aufsichtsbehörde zu beschweren. Wende dich dafür an die oben genannte Stelle. Eigene Sammlungsdaten lassen sich jederzeit als CSV exportieren.'] },
]
</script>
