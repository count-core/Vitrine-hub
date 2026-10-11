import { aiResponseSchema, type StampSuggestion } from './schema'

export interface NormalizedStamp {
  box: [number, number, number, number] | null
  boxOk: boolean
  country: string
  area: string
  year: number | null
  faceValue: string
  motif: string
  color: string
  michelNo: string
  condition: 'mnh' | 'hinged' | 'no_gum' | 'used' | 'unknown'
  type: 'stamp' | 'block' | 'booklet' | 'cover' | 'coin' | 'coin_set' | 'stamp_set' | 'banknote'
  series: string
  grade: string
  material: string
  mint: string
  diameterMm: number | null
  pieces: number | null
  rotation: 0 | 90 | 180 | 270
  confidence: number
  hint: string
  position: number
}

const CONDITION_MAP: Record<string, NormalizedStamp['condition']> = {
  '**': 'mnh', '*': 'hinged', '(*)': 'no_gum', 'o': 'used', 'unklar': 'unknown',
}

export function mapCondition(v: string | undefined): NormalizedStamp['condition'] {
  return CONDITION_MAP[(v || '').trim()] ?? 'unknown'
}

const TYPE_MAP: Record<string, NormalizedStamp['type']> = { marke: 'stamp', block: 'block', markenheftchen: 'booklet', beleg: 'cover', muenze: 'coin', muenzsatz: 'coin_set', markensatz: 'stamp_set', banknote: 'banknote' }
export function mapType(v: string | undefined): NormalizedStamp['type'] { return TYPE_MAP[(v || '').trim().toLowerCase()] ?? 'stamp' }
export const isCoinType = (t: string) => t === 'coin' || t === 'coin_set'

export function boxIsPlausible(box: unknown): box is [number, number, number, number] {
  if (!Array.isArray(box) || box.length !== 4) return false
  const b = box.map(Number)
  if (b.some(v => !Number.isFinite(v) || v < 0 || v > 1000)) return false
  const [y1, x1, y2, x2] = b as [number, number, number, number]
  return y2 - y1 >= 25 && x2 - x1 >= 25
}

export function iou(a: [number, number, number, number], b: [number, number, number, number]) {
  const iy1 = Math.max(a[0], b[0]), ix1 = Math.max(a[1], b[1]), iy2 = Math.min(a[2], b[2]), ix2 = Math.min(a[3], b[3])
  const inter = Math.max(0, iy2 - iy1) * Math.max(0, ix2 - ix1)
  const area = (r: typeof a) => (r[2] - r[0]) * (r[3] - r[1])
  const union = area(a) + area(b) - inter
  return union > 0 ? inter / union : 0
}

export function normalizeYear(v: unknown, now = new Date().getFullYear()): number | null {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN
  if (!Number.isFinite(n)) return null
  if (n < 1840 || n > now) return null
  return Math.trunc(n)
}

/** Parst eine rohe KI-Antwort, prüft Plausibilität und sortiert nach Leserichtung. */
export function normalizeResponse(raw: unknown, now = new Date().getFullYear()): NormalizedStamp[] {
  const parsed = aiResponseSchema.safeParse(raw)
  const stamps: StampSuggestion[] = parsed.success ? parsed.data.stamps : []
  const out: NormalizedStamp[] = stamps.map((s) => {
    const boxOk = boxIsPlausible(s.box_2d)
    const year = normalizeYear(s.jahr, now)
    let confidence = Math.max(0, Math.min(1, s.konfidenz ?? 0))
    const hints: string[] = s.hinweis ? [s.hinweis] : []
    if (!boxOk) hints.push('kein brauchbarer Rahmen')
    if (year === null && s.jahr != null && s.jahr !== '') { hints.push(`Jahr ${s.jahr} unplausibel`); confidence = Math.min(confidence, 0.5) }
    return {
      box: boxOk ? (s.box_2d!.map(Number) as [number, number, number, number]) : null,
      boxOk,
      country: s.land.trim(),
      area: s.sammelgebiet.trim(),
      year,
      faceValue: s.nennwert.trim(),
      motif: s.motiv.trim(),
      color: s.farbe.trim(),
      michelNo: s.michel_nr.trim(),
      condition: isCoinType(mapType(s.typ)) ? 'unknown' : mapCondition(s.erhaltung),
      type: mapType(s.typ),
      series: (s.serie || '').trim(),
      grade: isCoinType(mapType(s.typ)) && s.erhaltung_muenze && s.erhaltung_muenze !== 'unklar' ? s.erhaltung_muenze : '',
      material: (s.material || '').trim(),
      mint: (s.praegestaette || '').trim(),
      diameterMm: Number.isFinite(Number(s.durchmesser_mm)) && Number(s.durchmesser_mm) > 0 ? Number(s.durchmesser_mm) : null,
      pieces: Number.isFinite(Number(s.anzahl)) && Number(s.anzahl) > 0 ? Number(s.anzahl) : null,
      rotation: ([90, 180, 270].includes(Math.round(Number(s.drehung_grad) / 90) * 90 % 360) ? Math.round(Number(s.drehung_grad) / 90) * 90 % 360 : 0) as 0 | 90 | 180 | 270,
      confidence,
      hint: hints.join(' · '),
      position: 0,
    }
  })
  // Doppelt erkannte Marken (stark überlappende Rahmen) abwerten
  for (let i = 0; i < out.length; i++) {
    if (!out[i].box) continue
    for (let j = 0; j < i; j++) {
      if (out[j].box && iou(out[i].box!, out[j].box!) > 0.5) {
        out[i].hint = [out[i].hint, 'doppelt erkannt'].filter(Boolean).join(' · ')
        out[i].confidence = Math.min(out[i].confidence, 0.3)
        break
      }
    }
  }
  const allOk = out.length > 0 && out.every(s => s.boxOk)
  if (allOk) {
    out.sort((a, b) => {
      const ra = Math.round(a.box![0] / 120), rb = Math.round(b.box![0] / 120)
      return ra - rb || a.box![1] - b.box![1]
    })
  }
  out.forEach((s, i) => { s.position = i + 1 })
  return out
}
