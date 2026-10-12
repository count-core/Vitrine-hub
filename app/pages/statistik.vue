<template>
  <div class="flex flex-col gap-4">
    <div><h1 class="font-display text-3xl font-extrabold">Statistik</h1><p class="text-sm text-stone-500">Stand {{ now }} · Werte sind privat</p></div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div v-for="k in kpis" :key="k.label" class="rounded-2xl bg-white p-4 dark:bg-stone-900"><span class="flex items-center gap-1 text-xs font-semibold text-stone-500">{{ k.label }}<InfoTip v-if="k.help" :k="k.help" /></span><b class="mt-1 block text-2xl font-bold">{{ k.value }}</b><small v-if="k.sub" class="text-xs text-stone-500">{{ k.sub }}</small></div>
    </div>

    <div class="grid items-start gap-4 lg:grid-cols-2">
      <ChartsChartCard title="Positionen je Sammelgebiet" :subtitle="`${s.byArea.length} Gebiete`" :columns="['Gebiet', 'Positionen', 'Marken', 'Katalogwert']" :rows="s.byArea.map((a: any) => [a.key || 'ohne Angabe', a.positions, a.pieces, eur(a.value)])">
        <ChartsBarsH :data="s.byArea.map((a: any) => ({ key: a.key, value: a.positions, extra: `${a.pieces} Marken` }))" label="Positionen je Sammelgebiet" />
      </ChartsChartCard>
      <ChartsChartCard title="Katalogwert je Sammelgebiet" subtitle="Summe Katalogwert × Menge, nur Positionen mit Wert" :columns="['Gebiet', 'Katalogwert']" :rows="valueByArea.map((a: any) => [a.key || 'ohne Angabe', eur(a.value)])">
        <ChartsBarsH v-if="valueByArea.length" :data="valueByArea" label="Katalogwert je Gebiet" :fmt="eur" />
        <p v-else class="py-6 text-center text-sm text-stone-500">Noch keine Katalogwerte erfasst. Preise pflegst du auf der Positionsseite.</p>
      </ChartsChartCard>
      <ChartsChartCard title="Erhaltung" subtitle="Anteil der Positionen" :columns="['Erhaltung', 'Positionen', 'Marken']" :rows="condData.map((c: any) => [c.key, c.value, c.pieces])">
        <ChartsDonut :data="condData" label="Erhaltung" unit="Positionen" />
      </ChartsChartCard>
      <ChartsChartCard title="Ausgabejahr nach Jahrzehnt" :subtitle="s.totals.minYear ? `${s.totals.minYear} bis ${s.totals.maxYear}` : 'noch keine Jahre erfasst'" :columns="['Jahrzehnt', 'Positionen']" :rows="s.byDecade.map((d: any) => [d.key + 'er', d.positions])">
        <ChartsColumns v-if="s.byDecade.length" :data="s.byDecade.map((d: any) => ({ key: String(d.key), value: d.positions }))" label="Positionen je Jahrzehnt" />
        <p v-else class="py-6 text-center text-sm text-stone-500">Noch keine Jahre erfasst.</p>
      </ChartsChartCard>
      <ChartsChartCard title="Erfassung der letzten 90 Tage" subtitle="Neue Positionen pro Tag" :columns="['Tag', 'Positionen', 'Marken']" :rows="s.timeline.map((t: any) => [t.day, t.positions, t.pieces])">
        <ChartsLineArea :data="s.timeline.map((t: any) => ({ key: t.day.slice(5), value: t.positions }))" label="Erfassung pro Tag" />
      </ChartsChartCard>
      <ChartsChartCard title="Status" :columns="['Status', 'Positionen']" :rows="statusData.map((d: any) => [d.key, d.value])">
        <ChartsDonut :data="statusData" label="Status" unit="Positionen" />
      </ChartsChartCard>
    </div>

    <div class="grid items-start gap-4 lg:grid-cols-2">
      <section class="rounded-3xl bg-white p-4 dark:bg-stone-900">
        <h2 class="mb-2 text-sm font-bold">Wertvollste Positionen</h2>
        <p v-if="!s.topValue.length" class="text-sm text-stone-500">Noch keine Katalogwerte. Nutze die Preisrecherche auf der Positionsseite.</p>
        <NuxtLink v-for="t in s.topValue" :key="t.id" :to="`/sammlung/${t.id}`" class="flex items-center gap-3 border-t border-stone-100 py-2 first:border-0 dark:border-stone-800">
          <StampImage :file-key="t.images?.[0]?.fileKey" :size="36" /><span class="min-w-0 flex-1 text-sm"><b class="block truncate">{{ catalogRef(t) || t.faceValue }} · {{ t.motif }}</b><small class="text-stone-500">{{ t.area }} {{ t.year }} · {{ t.quantity }} Stück</small></span><b class="tabular">{{ eur(t.catalogValue) }}</b>
        </NuxtLink>
      </section>
      <section class="rounded-3xl bg-white p-4 dark:bg-stone-900">
        <h2 class="mb-2 flex items-center gap-1.5 text-sm font-bold">Datenqualität <InfoTip k="stats.quality" /></h2>
        <div v-for="q in quality" :key="q.label" class="py-1.5">
          <div class="flex justify-between text-sm"><span>{{ q.label }}</span><span class="tabular text-stone-500">{{ q.n }} von {{ s.totals.positions }}</span></div>
          <div class="mt-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800"><i class="block h-2 rounded-full bg-[var(--s1,#2a78d6)]" :style="{ width: pct(q.n) + '%' }" /></div>
        </div>
        <h2 class="mb-2 mt-4 text-sm font-bold">Alben</h2>
        <table class="w-full text-sm"><tbody><tr v-for="a in s.albums" :key="a.number" class="border-t border-stone-100 dark:border-stone-800"><td class="py-1.5">Album {{ a.number }}<span v-if="a.name && a.name !== `Album ${a.number}`" class="text-stone-500"> · {{ a.name }}</span></td><td class="py-1.5 text-right tabular">{{ a.positions }} Pos.</td><td class="py-1.5 text-right tabular text-stone-500">{{ a.sheets }} Blätter</td></tr></tbody></table>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { eur, cond, status } = useLabels()
const { data } = await useFetch<any>('/api/stats/full')
const s = computed(() => data.value || { totals: {}, byArea: [], byCondition: [], byStatus: [], byDecade: [], timeline: [], topValue: [], albums: [], prices: {} })
const now = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
const kpis = computed(() => { const t = s.value.totals, p = s.value.prices; return [
  { label: 'Positionen', value: t.positions ?? 0, sub: `${t.pieces ?? 0} Marken` },
  { label: 'Katalogwert', help: 'stats.catalog', value: eur(t.catalogValue ?? 0), sub: `${t.withCatalog ?? 0} Positionen mit Wert` },
  { label: 'Schätzwert', help: 'stats.est', value: eur(t.estValue ?? 0), sub: `${t.withEst ?? 0} Positionen mit Wert` },
  { label: 'KI-Marktschätzung', help: 'stats.ai', value: eur(p.estimateSum ?? 0), sub: `${p.estimates ?? 0} Schätzungen` },
  { label: 'Neu in 7 Tagen', value: t.last7 ?? 0, sub: `${t.last30 ?? 0} in 30 Tagen` },
  { label: 'Sammelgebiete', value: t.areas ?? 0 },
  { label: 'Preisbeobachtungen', help: 'price.observation', value: p.observations ?? 0, sub: `${p.itemsWithPrices ?? 0} Positionen` },
  { label: 'Ø KI-Konfidenz', help: 'capture.confidence', value: Math.round((t.avgConfidence ?? 0) * 100) + ' %' },
] })
const valueByArea = computed(() => s.value.byArea.filter((a: any) => a.value > 0).map((a: any) => ({ key: a.key, value: Math.round(a.value * 100) / 100 })))
const condData = computed(() => s.value.byCondition.map((c: any) => ({ key: `${cond(c.key).symbol} ${cond(c.key).label}`, value: c.positions, pieces: c.pieces })).sort((a: any, b: any) => b.value - a.value))
const statusData = computed(() => s.value.byStatus.map((c: any) => ({ key: status(c.key), value: c.positions })).sort((a: any, b: any) => b.value - a.value))
const quality = computed(() => { const t = s.value.totals; return [{ label: 'mit Katalognummer', n: t.withMichel ?? 0 }, { label: 'mit Foto', n: t.withImage ?? 0 }, { label: 'mit Katalogwert', n: t.withCatalog ?? 0 }, { label: 'mit Schätzwert', n: t.withEst ?? 0 }] })
const pct = (n: number) => s.value.totals.positions ? Math.round(n / s.value.totals.positions * 100) : 0
</script>
