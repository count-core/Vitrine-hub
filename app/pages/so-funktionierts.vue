<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-10">
    <header class="flex items-center justify-between">
      <NuxtLink to="/" class="font-display flex w-fit items-center gap-2 text-2xl font-extrabold"><span class="inline-block size-4 rounded bg-orange-500" />{{ cfg.appName }}</NuxtLink>
      <div class="flex gap-2"><UButton to="/login" label="Anmelden" color="neutral" variant="soft" /><UButton to="/register" label="Registrieren" /></div>
    </header>

    <section class="flex flex-col gap-4">
      <p class="text-xs font-bold uppercase tracking-wider text-orange-600">So funktioniert's</p>
      <h1 class="font-display max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">Albumblatt fotografieren, KI erkennt jede Marke und Münze, du prüfst und speicherst.</h1>
      <p class="max-w-2xl text-lg text-stone-600 dark:text-stone-300">Vitrine-Hub ist die Datenbank für die eigene Briefmarken- und Münzsammlung. Gebaut fürs Handy, damit das Erfassen am Küchentisch geht: ein Foto pro Blatt, die KI liest Gebiet, Jahr, Nennwert, Motiv und schlägt die Katalognummer vor.</p>
      <ol class="grid gap-3 sm:grid-cols-4">
        <li v-for="(s, i) in steps" :key="s.t" class="flex flex-col gap-2 rounded-3xl bg-white p-4 dark:bg-stone-900">
          <span class="flex size-9 items-center justify-center rounded-full bg-stone-900 font-display text-sm font-extrabold text-white dark:bg-white dark:text-stone-900">{{ i + 1 }}</span>
          <b class="font-display text-lg">{{ s.t }}</b><span class="text-sm text-stone-500">{{ s.d }}</span>
        </li>
      </ol>
    </section>

    <section class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div><h2 class="font-display text-2xl font-extrabold">Echte Erkennung, zum Anfassen</h2><p class="text-sm text-stone-500">Drei Testfotos, so wie sie die KI wirklich ausgewertet hat. Tippe auf eine Box oder einen Eintrag.</p></div>
        <div class="flex gap-1 rounded-full bg-white p-1 dark:bg-stone-900">
          <button v-for="d in demos" :key="d.key" type="button" class="rounded-full px-3 py-1.5 text-sm font-semibold" :class="d.key === active ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'" @click="active = d.key; selected = null">{{ d.label }}</button>
        </div>
      </div>
      <div class="grid gap-4 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <div class="relative overflow-hidden rounded-3xl bg-white p-2 dark:bg-stone-900">
            <div class="relative" :style="{ aspectRatio: `${cap.width} / ${cap.height}` }">
              <img :src="`/demo/${active}.webp`" :alt="demo.alt" class="absolute inset-0 size-full rounded-2xl object-cover">
              <button v-for="s in cap.stamps" :key="s.position" type="button" class="absolute rounded-md border-2 transition" :class="selected === s.position ? 'border-orange-500 bg-orange-500/20 shadow-[0_0_0_2px_white]' : 'border-white/90 bg-white/5 hover:bg-white/20'" :style="boxStyle(s.box)" :aria-label="`Position ${s.position}`" @click="selected = s.position">
                <span class="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-stone-900 text-[11px] font-bold text-white dark:bg-white dark:text-stone-900">{{ s.position }}</span>
              </button>
            </div>
          </div>
          <p class="mt-2 text-xs text-stone-500">{{ cap.stamps.length }} Positionen · Modell {{ cap.model }} · {{ (cap.durationMs / 1000).toFixed(1) }} s Analyse · Boxen kommen so von der KI</p>
        </div>
        <div class="flex max-h-[520px] flex-col gap-2 overflow-y-auto lg:col-span-2">
          <button v-for="s in cap.stamps" :key="s.position" type="button" class="flex items-start gap-3 rounded-2xl bg-white p-3 text-left transition dark:bg-stone-900" :class="selected === s.position ? 'ring-2 ring-orange-500' : ''" @click="selected = s.position">
            <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold dark:bg-stone-800">{{ s.position }}</span>
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-x-2 gap-y-0.5"><b class="font-display">{{ title(s) }}</b><UBadge v-if="s.type !== 'stamp'" size="sm" color="neutral" variant="soft">{{ typeLabel(s.type) }}<span v-if="s.pieces"> · {{ s.pieces }} Stück</span></UBadge></span>
              <span class="block truncate text-sm text-stone-600 dark:text-stone-300">{{ s.motif }}</span>
              <span class="block text-xs text-stone-500">{{ [s.area, s.year, catalogRef(s), s.material, s.mint ? 'Prägestätte ' + s.mint : '', s.grade].filter(Boolean).join(' · ') }} · {{ Math.round(s.confidence * 100) }} % sicher</span>
            </span>
          </button>
        </div>
      </div>
      <p class="rounded-2xl bg-orange-50 p-4 text-sm text-stone-700 dark:bg-orange-950 dark:text-stone-200"><b>Im Prüf-Schritt</b> stehen alle Felder in einem Formular pro Position. Falsches korrigieren, Unerwünschtes abwählen, dann "übernehmen". Jede Marke bekommt ihren Ausschnitt als eigenes Bild, automatisch aufrecht gedreht, und das ganze Blatt bleibt als Gesamtfoto erhalten. Bei Münzen fragt die App vor dem Speichern nach der Rückseite.</p>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="font-display text-2xl font-extrabold">Was die App sonst noch kann</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="f in features" :key="f.t" class="flex gap-3 rounded-3xl bg-white p-4 dark:bg-stone-900">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"><UIcon :name="f.i" class="size-5" /></span>
          <span><b class="font-display block">{{ f.t }}</b><span class="text-sm text-stone-500">{{ f.d }}</span></span>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-4 rounded-3xl bg-stone-900 p-6 text-white dark:bg-white dark:text-stone-900">
      <h2 class="font-display text-2xl font-extrabold">Die KI gehört dir</h2>
      <p class="max-w-2xl text-stone-300 dark:text-stone-600">Vitrine-Hub bringt keinen eigenen Dienst mit, sondern ruft eine KI deiner Wahl auf. Standard ist Google Gemini, weil der kostenlose Zugang für Albumblätter reicht. In den Einstellungen kannst du jederzeit umstellen, mit Anleitung, wie man den Schlüssel anlegt.</p>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="p in AI_PROVIDERS" :key="p.id" class="rounded-2xl bg-white/10 p-3 text-sm dark:bg-stone-100"><b>{{ p.label }}</b><span class="block text-stone-300 dark:text-stone-600">{{ p.cost }}</span></li>
      </ul>
    </section>

    <section class="flex flex-col items-start gap-3 pb-10">
      <h2 class="font-display text-2xl font-extrabold">Loslegen</h2>
      <p class="text-stone-600 dark:text-stone-300">Anmelden, ein Album aufschlagen, erstes Blatt fotografieren. Auf dem Handy lässt sich die Seite als App auf den Startbildschirm legen, dann funktioniert das Fotografieren auch ohne Netz.</p>
      <div class="flex gap-2"><UButton to="/login" size="xl" label="Anmelden" /><UButton to="/register" size="xl" color="neutral" variant="soft" label="Konto anlegen" /></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { AI_PROVIDERS } from '#shared/utils/aiProviders'
import { DEMO_CAPTURES } from '~/utils/demoData'

definePageMeta({ layout: 'blank' })
const cfg = useRuntimeConfig().public
useSeoMeta({
  title: `So funktioniert's · ${cfg.appName}`,
  description: 'Briefmarken- und Münzsammlung per Handyfoto erfassen: die KI erkennt jede Marke und Münze, du prüfst und speicherst. Statistik, Preisrecherche, öffentliche Schauseite.',
  ogTitle: `${cfg.appName}: Sammlung per Foto erfassen`,
  ogDescription: 'Albumblatt fotografieren, KI erkennt jede Marke und Münze, du prüfst und speicherst.',
  ogImage: '/demo/ddr-kleinbogen.webp',
  robots: 'index,follow',
})

const demos = [
  { key: 'ddr-kleinbogen', label: 'DDR-Kleinbogen', alt: 'Albumblatt mit einem DDR-Kleinbogen von 1978' },
  { key: 'album-reich', label: 'Album Deutsches Reich', alt: 'Albumblatt mit Inflationsmarken des Deutschen Reichs' },
  { key: 'muenzset-2020', label: 'Münzset 2020', alt: '20-Euro-Sammlermünzenset 2020 im Blister' },
] as const
type DemoKey = typeof demos[number]['key']
const active = ref<DemoKey>('ddr-kleinbogen')
const selected = ref<number | null>(null)
const demo = computed(() => demos.find(d => d.key === active.value)!)
type DemoStamp = { position: number, box: readonly number[] | null, type: string, michelNo?: string, [k: string]: any }
const cap = computed(() => { const c = DEMO_CAPTURES[active.value]; return { ...c, stamps: c.stamps as unknown as readonly DemoStamp[] } })

function boxStyle(box: readonly number[] | null) {
  if (!box) return { display: 'none' }
  const [y1 = 0, x1 = 0, y2 = 0, x2 = 0] = box
  return { top: `${y1 / 10}%`, left: `${x1 / 10}%`, height: `${(y2 - y1) / 10}%`, width: `${(x2 - x1) / 10}%` }
}
const isCoin = (t: string) => t === 'coin' || t === 'coin_set'
const typeLabel = (t: string) => ({ block: 'Bogen/Block', booklet: 'Heftchen', cover: 'Beleg', coin: 'Münze', coin_set: 'Münzsatz', stamp_set: 'Markensatz', banknote: 'Banknote' } as Record<string, string>)[t] || t
const title = (s: any) => s.faceValue || s.motif || typeLabel(s.type)

const steps = [
  { t: 'Fotografieren', d: 'Ein Foto pro Albumblatt, Steckkarte oder Münztablett, direkt mit der Handykamera.' },
  { t: 'Erkennen lassen', d: 'Die KI findet jede Marke und Münze, liest Gebiet, Jahr, Nennwert, Motiv, Material und schlägt die Katalognummer vor.' },
  { t: 'Prüfen', d: 'Alles steht in einem Formular pro Stück. Korrigieren, abwählen, Serie setzen.' },
  { t: 'Speichern', d: 'Jedes Stück landet mit Ausschnitt, Gesamtfoto, Album und Blatt in der Sammlung.' },
]
const features = [
  { i: 'i-lucide-search', t: 'Suche in Sekunden', d: 'Volltext über Gebiet, Nummer, Motiv, Jahr und Notizen, mit Filtern nach Album, Erhaltung und Status.' },
  { i: 'i-lucide-coins', t: 'Münzen und Sätze', d: 'Erhaltungsgrad, Prägestätte, Material, Rückseitenfoto. Komplette Sätze bleiben als Einheit mit Gesamtbild.' },
  { i: 'i-lucide-chart-bar', t: 'Statistik', d: 'Bestand nach Gebiet, Jahrzehnt und Erhaltung, Werte, Datenqualität, Erfassungsverlauf.' },
  { i: 'i-lucide-tag', t: 'Preisrecherche', d: 'Fertige Suchlinks zu eBay, Delcampe, Philasearch und MA-Shops, eigene Preisbeobachtungen, KI-Schätzung.' },
  { i: 'i-lucide-hand', t: 'Sortieren per Wischen', d: 'Dubletten, Verkaufskandidaten und Behalten in einem Rutsch entscheiden, wie in einer Dating-App.' },
  { i: 'i-lucide-wifi-off', t: 'Offline erfassen', d: 'Fotos werden ohne Netz gesammelt und analysiert, sobald wieder Verbindung da ist.' },
  { i: 'i-lucide-globe', t: 'Öffentliche Sammlung', d: 'Auf Wunsch eine Schauseite per Link, mit Wunschliste als "Gesucht" und Anfragen mit Preisvorschlag.' },
  { i: 'i-lucide-users', t: 'Familie einladen', d: 'Rollen "Nur ansehen" und "Bearbeiten", Einladungslinks, Registrierung sonst geschlossen.' },
  { i: 'i-lucide-download', t: 'Deine Daten', d: 'CSV-Export jederzeit, Bilder liegen auf dem eigenen Server, keine Bindung an einen Anbieter.' },
]
</script>
