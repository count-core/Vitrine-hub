import { catalogNumber } from './gaps'

/**
 * Abgleich eines erkannten Stücks mit dem eigenen Bestand.
 * Katalognummern aus der KI sind unzuverlässig, deshalb zählen Motiv, Jahr und Nennwert mit.
 */
export interface Candidate { id: string, area: string, year: number | null, michelNo: string, motif: string, faceValue: string, type: string, quantity: number, status: string }
export interface Detected { area: string, year: number | null, michelNo: string, motif: string, faceValue: string, type: string }
export type MatchedBy = 'number' | 'motif' | 'value' | 'none'

export function norm(s: unknown) {
  return String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9äöüß]/g, '')
}

/** Kürzt Klammerzusätze und Künstlernamen weg: "Sitzende Frau (Jean Antoine Watteau)" -> "sitzendefrau". */
export function motifKey(s: unknown) {
  return norm(String(s ?? '').replace(/\([^)]*\)/g, '').split(',')[0])
}

const coinLike = (t: string) => t === 'coin' || t === 'coin_set'
/** Marke und Block zählen als verwandt, Münze und Münzsatz ebenfalls. */
function typeFits(a: string, b: string) {
  if (!a || !b) return true
  return coinLike(a) === coinLike(b)
}

function yearFits(a: number | null, b: number | null) {
  if (a == null || b == null) return true
  return Math.abs(a - b) <= 1
}

/** Findet die passenden Bestandsstücke zu einem erkannten Stück. */
export function findMatches(det: Detected, pool: Candidate[]): { matches: Candidate[], by: MatchedBy } {
  const area = norm(det.area)
  const inArea = pool.filter(c => norm(c.area) === area && typeFits(c.type, det.type))
  if (!inArea.length) return { matches: [], by: 'none' }

  const n = catalogNumber(det.michelNo)
  if (n != null) {
    const byNumber = inArea.filter(c => catalogNumber(c.michelNo) === n && yearFits(c.year, det.year))
    if (byNumber.length) return { matches: byNumber, by: 'number' }
  }

  const key = motifKey(det.motif)
  if (key.length >= 6) {
    const byMotif = inArea.filter(c => {
      const ck = motifKey(c.motif)
      if (ck.length < 6 || !yearFits(c.year, det.year)) return false
      return ck === key || ck.includes(key) || key.includes(ck)
    })
    if (byMotif.length) return { matches: byMotif, by: 'motif' }
  }

  const fv = norm(det.faceValue)
  if (fv && det.year) {
    const byValue = inArea.filter(c => norm(c.faceValue) === fv && c.year === det.year)
    if (byValue.length) return { matches: byValue, by: 'value' }
  }
  return { matches: [], by: 'none' }
}

/** Fasst das Ergebnis für die Anzeige zusammen. */
export function verdictFor(det: Detected, pool: Candidate[]) {
  const { matches, by } = findMatches(det, pool)
  const owned = matches.filter(m => m.status !== 'wanted' && m.status !== 'sold')
  const wanted = matches.filter(m => m.status === 'wanted')
  return {
    verdict: owned.length ? 'owned' as const : wanted.length ? 'wanted' as const : 'new' as const,
    matchedBy: by,
    ownedQuantity: owned.reduce((a, m) => a + (m.quantity || 1), 0),
    itemId: (owned[0] || wanted[0])?.id ?? null,
  }
}
