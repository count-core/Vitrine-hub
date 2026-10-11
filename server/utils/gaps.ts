/**
 * Lückenanalyse: findet fehlende Katalognummern in einer Sammlung.
 * Rein rechnerisch aus dem eigenen Bestand, ohne Katalogdaten: zwischen der kleinsten und
 * größten vorhandenen Nummer einer Gruppe fehlende Nummern melden.
 */

export interface GapItem { area: string, year: number | null, michelNo: string, type: string, series: string, condition: string }
export interface GapGroup {
  key: string
  area: string
  type: string
  series: string
  /** Jahresspanne der vorhandenen Stücke, nur zur Anzeige. */
  from: number | null
  to: number | null
  have: number
  /** Fehlende Nummern, aufsteigend. */
  missing: number[]
  /** Kleinste und größte vorhandene Nummer der Gruppe. */
  min: number
  max: number
}

/** Zieht die führende Zahl einer Katalognummer. "320a" -> 320, "Block 5" -> 5, "1234-1236" -> 1234. Ohne Zahl: null. */
export function catalogNumber(raw: string): number | null {
  const s = String(raw || '').trim()
  if (!s) return null
  const m = s.match(/(\d{1,6})/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 && n < 100000 ? n : null
}

export interface GapOptions {
  /** Ab wie vielen vorhandenen Nummern eine Gruppe ausgewertet wird. */
  minHave?: number
  /** Längste Lücke am Stück, die noch als Lücke gilt. Größere Abstände sind Bereiche, die gar nicht gesammelt werden. */
  maxRun?: number
  /** Höchstens so viele fehlende Nummern je Gruppe melden. */
  maxPerGroup?: number
  /** Nach Serie statt nur nach Gebiet gruppieren, wenn eine Serie gesetzt ist. */
  bySeries?: boolean
}

/**
 * Gruppiert nach Sammelgebiet (und optional Serie) und meldet die Lücken je Gruppe.
 * Eine Folge fehlender Nummern, die länger als maxRun ist, wird übersprungen.
 */
export function findGaps(items: GapItem[], opts: GapOptions = {}): GapGroup[] {
  const { minHave = 3, maxRun = 10, maxPerGroup = 60, bySeries = true } = opts
  const groups = new Map<string, { area: string, type: string, series: string, nums: Set<number>, years: number[] }>()

  for (const it of items) {
    const n = catalogNumber(it.michelNo)
    if (n == null) continue
    const series = bySeries ? (it.series || '') : ''
    const key = `${it.area}|${it.type}|${series}`
    let g = groups.get(key)
    if (!g) { g = { area: it.area, type: it.type, series, nums: new Set(), years: [] }; groups.set(key, g) }
    g.nums.add(n)
    if (it.year) g.years.push(it.year)
  }

  const out: GapGroup[] = []
  for (const [key, g] of groups) {
    if (g.nums.size < minHave) continue
    const sorted = [...g.nums].sort((a, b) => a - b)
    const missing: number[] = []
    for (let i = 0; i < sorted.length - 1; i++) {
      const run = sorted[i + 1]! - sorted[i]! - 1
      if (run <= 0 || run > maxRun) continue
      for (let n = sorted[i]! + 1; n < sorted[i + 1]!; n++) missing.push(n)
    }
    if (!missing.length) continue
    out.push({
      key, area: g.area, type: g.type, series: g.series,
      from: g.years.length ? Math.min(...g.years) : null,
      to: g.years.length ? Math.max(...g.years) : null,
      have: sorted.length,
      missing: missing.slice(0, maxPerGroup),
      min: sorted[0]!, max: sorted[sorted.length - 1]!,
    })
  }
  return out.sort((a, b) => b.missing.length - a.missing.length)
}

export { formatRanges } from '#shared/utils/ranges'
