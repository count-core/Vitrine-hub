<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <h1 class="font-display text-3xl font-extrabold">Erfassen</h1>

    <section class="rounded-3xl bg-white p-4 dark:bg-stone-900">
      <div class="grid grid-cols-2 items-end gap-3 sm:grid-cols-5">
        <UFormField label="Inhalt"><template #hint><InfoTip k="capture.mode" /></template><USelect v-model="prefs.mode" :items="modeItems" class="w-full" /></UFormField>
        <UFormField label="Album"><template #hint><InfoTip k="capture.album" /></template><UInput v-model="prefs.album" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Blatt"><template #hint><InfoTip k="capture.sheet" /></template><UInput v-model="prefs.sheet" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Erhaltung"><template #hint><InfoTip k="capture.condition" /></template><USelect v-model="prefs.condition" :items="condDefaults" class="w-full" /></UFormField>
        <UFormField label="Gebiet-Hinweis"><template #hint><InfoTip k="capture.hint" /></template><UInputMenu v-model="prefs.hint" :items="AREAS" create-item placeholder="z. B. DDR" class="w-full" @create="prefs.hint = $event" /></UFormField>
      </div>
      <p class="mt-2 text-xs text-stone-500">Bleibt gespeichert. Das Blatt zählt nach jedem Übernehmen automatisch hoch. KI: {{ me?.ai?.provider }} · {{ me?.ai?.model }}</p>
    </section>

    <label class="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-lg font-bold text-white shadow-lg shadow-orange-500/30">
      <UIcon name="i-lucide-camera" class="size-6" />Albumblatt fotografieren oder Fotos wählen
      <input type="file" accept="image/*" capture="environment" multiple class="hidden" @change="onFiles">
    </label>
    <p v-if="queue.length" class="text-sm text-stone-500">{{ queue.length }} Foto(s) warten.</p>
    <div v-if="!online" class="rounded-2xl bg-amber-100 p-3 text-sm dark:bg-amber-950">Offline. Fotos werden auf dem Handy zwischengespeichert und später analysiert.</div>
    <div v-else-if="offline.count.value" class="flex items-center justify-between gap-2 rounded-2xl bg-sky-100 p-3 text-sm dark:bg-sky-950"><span>{{ offline.count.value }} Foto(s) aus der Offline-Warteschlange.</span><UButton size="sm" label="Jetzt analysieren" @click="loadOffline" /></div>

    <section v-if="cur" class="flex flex-col gap-4 rounded-3xl bg-white p-4 dark:bg-stone-900">
      <div class="flex items-center justify-between"><h2 class="font-display text-xl font-extrabold">Prüfen und übernehmen</h2><span class="text-xs text-stone-500">{{ cur.status }}</span></div>
      <SheetImage v-slot="{ boxStyle }" :src="cur.previewUrl" alt="Aufgenommenes Blatt" :max-height="420" @load="onPreviewLoad">
        <div v-for="s in cur.stamps.filter(x => x.box)" :key="s.position" class="pointer-events-none absolute rounded border-2 border-sky-300 shadow-[0_0_0_2px_rgba(0,0,0,.4)]" :style="boxStyle(s.box!)">
          <span class="absolute bottom-full left-0 mb-0.5 hidden rounded bg-sky-300 px-1 text-[10px] font-bold leading-tight text-sky-950 sm:inline-block">{{ s.position }}</span>
        </div>
      </SheetImage>
      <UAlert v-if="cur.error" color="error" variant="soft" title="KI-Erkennung fehlgeschlagen" :description="cur.error + ' – Das Foto ist gespeichert. Du kannst die Marken unten von Hand ergänzen.'" />
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span class="text-stone-500">{{ cur.stamps.length }} Marken · Album {{ prefs.album }}, Blatt {{ prefs.sheet }}<span v-if="cur.durationMs"> · {{ (cur.durationMs / 1000).toFixed(1) }} s</span></span>
        <div class="flex gap-2"><UButton size="xs" color="neutral" variant="soft" label="Alle an" @click="cur.stamps.forEach(s => s.on = true)" /><UButton size="xs" color="neutral" variant="soft" label="Alle aus" @click="cur.stamps.forEach(s => s.on = false)" /><UButton size="xs" color="neutral" variant="soft" icon="i-lucide-plus" label="Marke ergänzen" @click="addManual" /></div>
      </div>

      <div v-for="(s, i) in cur.stamps" :key="i" class="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-stone-200 p-3 dark:border-stone-700" :class="s.on ? '' : 'opacity-40'" :data-coin-missing="isCoin(s.type) && s.on && !s.reverse ? '' : undefined">
        <div class="flex flex-col items-center gap-1"><img :src="s.thumb || cur.previewUrl" alt="" class="w-[72px] max-h-24 rounded-md bg-stone-200 object-contain transition-transform dark:bg-stone-700" :style="{ transform: `rotate(${s.rotation}deg)` }"><button type="button" class="text-[10px] text-stone-500 underline" title="Um 90° drehen" @click="s.rotation = (s.rotation + 90) % 360">↻ {{ s.rotation }}°</button></div>
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <UCheckbox v-model="s.on" :label="`Pos. ${s.position}`" :ui="{ label: 'font-bold' }" /><UBadge v-if="s.type !== 'stamp'" color="neutral" variant="soft" size="sm">{{ TYPES.find(t => t.value === s.type)?.label }}<span v-if="s.pieces"> · {{ s.pieces }} Stück</span></UBadge>
            <UBadge :color="s.confidence >= .7 ? 'success' : s.confidence >= .4 ? 'warning' : 'error'" variant="soft" size="sm">{{ Math.round(s.confidence * 100) }} % sicher</UBadge>
            <span v-if="s.hint" class="text-xs text-stone-500">{{ s.hint }}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <USelect v-model="s.type" :items="typeItems" size="sm" />
            <UInput v-model="s.area" size="sm" placeholder="Gebiet" />
            <UInput v-model="s.year" size="sm" placeholder="Jahr" class="font-mono" />
            <UInput v-model="s.michelNo" size="sm" :placeholder="catalogLabel(s.type)" class="font-mono" />
            <UInput v-model="s.faceValue" size="sm" placeholder="Nennwert" />
            <UInput v-model="s.motif" size="sm" placeholder="Motiv" class="col-span-2" />
            <UInput v-model="s.series" size="sm" placeholder="Serie / Satz" class="col-span-2" />
            <USelect v-if="isCoin(s.type)" v-model="s.grade" :items="gradeItems" size="sm" />
            <USelect v-else v-model="s.condition" :items="condItems" size="sm" />
            <UInputNumber v-model="s.quantity" :min="1" size="sm" />
            <template v-if="isCoin(s.type)"><UInput v-model="s.mint" size="sm" placeholder="Prägestätte" class="font-mono" /><UInput v-model="s.material" size="sm" placeholder="Material" /></template>
          </div>
          <div v-if="isCoin(s.type)" class="flex items-center gap-2 rounded-xl border border-dashed p-2 text-xs" :class="s.reverse ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950' : 'border-stone-300 dark:border-stone-700'">
            <img v-if="s.reverseUrl" :src="s.reverseUrl" alt="Rückseite" class="size-12 rounded-md object-cover">
            <span class="flex-1"><b>Rückseite</b> {{ s.reverse ? 'aufgenommen' : 'fehlt noch. Münze herausnehmen, wenden, fotografieren.' }}</span>
            <label class="cursor-pointer rounded-lg bg-stone-900 px-2.5 py-1.5 font-semibold text-white dark:bg-white dark:text-stone-900"><UIcon name="i-lucide-camera" class="mr-1 size-3.5 align-middle" />{{ s.reverse ? 'Neu' : 'Foto' }}<input type="file" accept="image/*" capture="environment" class="hidden" @change="setReverse(s, $event)"></label>
            <button v-if="s.reverse" type="button" class="text-stone-500 underline" @click="clearReverse(s)">entfernen</button>
          </div>
        </div>
      </div>

      <UButton size="xl" block :label="`${cur.stamps.filter(s => s.on).length} Stücke übernehmen${coinsWithoutReverse.length ? ` · ${coinsWithoutReverse.length} Münzen ohne Rückseite` : ''}`" :loading="committing" :disabled="!cur.stamps.some(s => s.on)" @click="commit()" />
      <UButton color="neutral" variant="ghost" label="Dieses Foto verwerfen" @click="next" />
    </section>

    <UModal v-model:open="reverseModal" title="Rückseiten der Münzen fotografieren?">
      <template #body>
        <div class="flex flex-col gap-3 text-sm">
          <p>{{ coinsWithoutReverse.length }} Münze{{ coinsWithoutReverse.length === 1 ? '' : 'n' }} ohne Rückseitenfoto. Wenn du die Münzen herausnehmen kannst, fotografiere jede Rückseite einzeln. Bei fest eingeschweißten Sätzen geht das nicht, dann ohne Rückseite speichern.</p>
          <UButton label="Ja, Rückseiten fotografieren" @click="reverseModal = false; scrollToFirstCoin()" />
          <UButton label="Nicht möglich, ohne Rückseite speichern" color="neutral" variant="soft" @click="reverseModal = false; commit(true)" />
        </div>
      </template>
    </UModal>
    <section v-if="done.length" class="rounded-3xl bg-emerald-50 p-4 text-sm dark:bg-emerald-950">
      <b>{{ done.reduce((a, d) => a + d, 0) }} Positionen</b> in dieser Sitzung übernommen. <NuxtLink to="/sammlung?sort=newest" class="font-semibold underline">Zur Sammlung</NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { data: me } = useMe()
const toast = useToast()
const prefs = reactive({ album: '1', sheet: '1', condition: 'auto', hint: '', mode: 'auto' })
const modeItems = [{ label: 'Automatisch', value: 'auto' }, { label: 'Briefmarken', value: 'stamps' }, { label: 'Münzen', value: 'coins' }]
const typeItems = TYPES.map(t => ({ label: t.label, value: t.value as string }))
const gradeItems = [{ label: 'Erhaltung?', value: 'none' }, ...GRADES.map(g => ({ label: g, value: g }))]
onMounted(() => { try { Object.assign(prefs, JSON.parse(localStorage.getItem('erfassen-prefs') || '{}')) } catch {} })
watch(prefs, p => { try { localStorage.setItem('erfassen-prefs', JSON.stringify(p)) } catch {} }, { deep: true })
const condDefaults = [{ label: 'KI vermuten lassen', value: 'auto' }, ...CONDITIONS.slice(0, 4).map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value as string }))]
const condItems = CONDITIONS.slice(0, 4).map(c => ({ label: `${c.symbol} ${c.label}`, value: c.value as string }))

interface Stamp { rotation: number, reverse?: File, reverseUrl?: string, position: number, box: [number, number, number, number] | null, type: string, series: string, grade: string, material: string, mint: string, diameterMm: number | null, pieces: number | null, area: string, country: string, year: string, michelNo: string, faceValue: string, motif: string, color: string, condition: string, quantity: number, confidence: number, hint: string, on: boolean, thumb?: string }
interface Current { file: File, previewUrl: string, captureId?: string, stamps: Stamp[], status: string, error?: string, durationMs?: number }
const offline = useOfflineQueue()
const online = ref(true)
onMounted(async () => { online.value = navigator.onLine; window.addEventListener('online', () => { online.value = true }); window.addEventListener('offline', () => { online.value = false }); await offline.refresh() })
async function loadOffline() { const q = await offline.all(); for (const p of q) { queue.value.push(new File([p.file], p.name || 'foto.jpg', { type: p.file.type || 'image/jpeg' })); await offline.remove(p.id) } if (!cur.value) next() }
const queue = ref<File[]>([]), cur = ref<Current | null>(null), committing = ref(false), done = ref<number[]>([])
const reverseModal = ref(false)
const coinsWithoutReverse = computed(() => (cur.value?.stamps || []).filter(s => s.on && isCoin(s.type) && !s.reverse))
function setReverse(s: Stamp, e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; (e.target as HTMLInputElement).value = ''; if (!f) return; if (s.reverseUrl) URL.revokeObjectURL(s.reverseUrl); s.reverse = f; s.reverseUrl = URL.createObjectURL(f) }
function clearReverse(s: Stamp) { if (s.reverseUrl) URL.revokeObjectURL(s.reverseUrl); s.reverse = undefined; s.reverseUrl = undefined }
const previewImg = shallowRef<HTMLImageElement>()
function onPreviewLoad(img: HTMLImageElement) { previewImg.value = img; drawCrops() }

async function onFiles(e: Event) {
  const files = [...((e.target as HTMLInputElement).files || [])]; (e.target as HTMLInputElement).value = ''
  if (!online.value) { for (const f of files) await offline.add({ file: f, name: f.name, hint: prefs.hint, mode: prefs.mode, album: prefs.album, sheet: prefs.sheet }); toast.add({ title: `${files.length} Foto(s) offline gespeichert`, description: 'Sie werden analysiert, sobald du wieder online bist.', color: 'info' }); return }
  queue.value.push(...files); if (!cur.value) next()
}

async function next() {
  if (cur.value) URL.revokeObjectURL(cur.value.previewUrl)
  const file = queue.value.shift(); if (!file) { cur.value = null; return }
  cur.value = { file, previewUrl: URL.createObjectURL(file), stamps: [], status: 'Foto wird hochgeladen und analysiert …' }
  try {
    const fd = new FormData(); fd.append('file', file); fd.append('hint', prefs.hint || ''); fd.append('mode', prefs.mode || 'auto')
    const res: any = await $fetch('/api/captures', { method: 'POST', body: fd })
    if (cur.value?.file !== file) return
    cur.value.captureId = res.capture.id; cur.value.durationMs = res.capture.durationMs; cur.value.error = res.error || undefined
    cur.value.status = res.error ? 'Fehler' : `${res.capture.provider} · ${res.capture.model}`
    cur.value.stamps = (res.stamps as any[]).map(s => ({ ...s, grade: s.grade || 'none', year: s.year == null ? '' : String(s.year), condition: prefs.condition !== 'auto' ? prefs.condition : (s.condition === 'unknown' ? 'mnh' : s.condition), quantity: 1, on: s.confidence >= 0.4 }))
    if (!cur.value.stamps.length && !res.error) toast.add({ title: 'Keine Marke erkannt', description: 'Du kannst Marken von Hand ergänzen.', color: 'warning' })
    await nextTick(); drawCrops()
  } catch (e: any) {
    if (cur.value) { cur.value.status = 'Fehler'; cur.value.error = e?.data?.statusMessage || e?.message || 'Upload fehlgeschlagen' }
    if (!e?.data && cur.value) { await offline.add({ file: file, name: file.name, hint: prefs.hint, mode: prefs.mode, album: prefs.album, sheet: prefs.sheet }); toast.add({ title: 'Keine Verbindung, Foto offline gespeichert', color: 'warning' }); cur.value = null; return next() }
  }
}

function addManual() { if (!cur.value) return; cur.value.stamps.push({ position: cur.value.stamps.length + 1, box: null, rotation: 0, type: prefs.mode === 'coins' ? 'coin' : 'stamp', series: '', grade: 'none', material: '', mint: '', diameterMm: null, pieces: null, area: prefs.hint || '', country: '', year: '', michelNo: '', faceValue: '', motif: '', color: '', condition: prefs.condition !== 'auto' ? prefs.condition : 'mnh', quantity: 1, confidence: 0, hint: 'von Hand', on: true }) }


function drawCrops() {
  const img = previewImg.value; if (!img || !cur.value || !img.naturalWidth) return
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
  const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)
  for (const s of cur.value.stamps) {
    if (!s.box || s.thumb) continue
    const [y1, x1, y2, x2] = s.box.map(v => v / 1000) as [number, number, number, number]
    const sw = (x2 - x1) * c.width, sh = (y2 - y1) * c.height
    const t = document.createElement('canvas'); const k = Math.min(1, 240 / Math.max(sw, sh)); t.width = Math.max(1, Math.round(sw * k)); t.height = Math.max(1, Math.round(sh * k))
    t.getContext('2d')!.drawImage(c, x1 * c.width, y1 * c.height, sw, sh, 0, 0, t.width, t.height)
    s.thumb = t.toDataURL('image/jpeg', 0.8)
  }
}

function scrollToFirstCoin() { const el = document.querySelector('[data-coin-missing]'); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
async function commit(skipReverse = false) {
  if (!cur.value?.captureId) return
  if (!skipReverse && coinsWithoutReverse.value.length) { reverseModal.value = true; return }
  committing.value = true
  try {
    const selected = cur.value.stamps.filter(s => s.on)
    const stamps = selected.map(({ thumb, on, pieces, reverse, reverseUrl, ...s }) => ({ ...s, grade: s.grade === 'none' ? '' : s.grade, year: s.year === '' ? null : Number(s.year) }))
    const res: any = await $fetch(`/api/captures/${cur.value.captureId}/commit`, { method: 'POST', body: { albumNumber: Number(prefs.album) || undefined, sheet: Number(prefs.sheet) || undefined, stamps } })
    let reverses = 0
    for (const [i, id] of (res.created as string[]).entries()) {
      const s = selected[i]; if (!s?.reverse) continue
      const fd = new FormData(); fd.append('file', s.reverse)
      try { await $fetch(`/api/items/${id}/images`, { method: 'POST', body: fd }); reverses++ } catch { toast.add({ title: `Rückseite von Pos. ${s.position} konnte nicht gespeichert werden`, color: 'warning' }) }
    }
    if (reverses) toast.add({ title: `${reverses} Rückseiten gespeichert`, color: 'success' })
    done.value.push(res.created.length)
    toast.add({ title: `${res.created.length} Positionen übernommen`, description: `Album ${prefs.album}, Blatt ${prefs.sheet}`, color: 'success' })
    prefs.sheet = String((Number(prefs.sheet) || 0) + 1)
    await next()
  } catch (e: any) {
    toast.add({ title: 'Übernehmen fehlgeschlagen', description: e?.data?.statusMessage || e?.message, color: 'error' })
  } finally { committing.value = false }
}
</script>
