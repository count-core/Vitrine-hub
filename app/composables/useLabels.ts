export const CONDITIONS = [
  { value: 'mnh', symbol: '**', label: 'postfrisch', color: 'success' },
  { value: 'hinged', symbol: '*', label: 'mit Falz', color: 'warning' },
  { value: 'no_gum', symbol: '(*)', label: 'ohne Gummi', color: 'neutral' },
  { value: 'used', symbol: 'o', label: 'gestempelt', color: 'info' },
  { value: 'unknown', symbol: '?', label: 'unklar', color: 'neutral' },
] as const

export const STATUSES = [
  { value: 'collection', label: 'Sammlung' },
  { value: 'duplicate', label: 'Dublette' },
  { value: 'for_sale', label: 'Zum Verkauf' },
  { value: 'sold', label: 'Verkauft' },
  { value: 'wanted', label: 'Gesucht' },
] as const

export const TYPES = [
  { value: 'stamp', label: 'Marke' },
  { value: 'block', label: 'Block' },
  { value: 'booklet', label: 'Markenheftchen' },
  { value: 'stamp_set', label: 'Markensatz' },
  { value: 'cover', label: 'Beleg / Brief' },
  { value: 'coin', label: 'Münze' },
  { value: 'coin_set', label: 'Münzsatz' },
  { value: 'banknote', label: 'Banknote' },
] as const

export const GRADES = ['s', 'ss', 'vz', 'st', 'PP'] as const
export const isCoin = (t: string) => t === 'coin' || t === 'coin_set'
export const catalogLabel = (t: string) => isCoin(t) ? 'Jaeger-Nr.' : t === 'banknote' ? 'Rosenberg-Nr.' : 'Michel-Nr.'
/** Kürzel vor der Katalognummer: Marken Michel, Münzen Jaeger, Banknoten Rosenberg. */
export const catalogShort = (t?: string) => isCoin(t || '') ? 'J.' : t === 'banknote' ? 'R.' : 'Mi'
/** Fertige Katalogangabe, leer wenn keine Nummer erfasst ist. */
export const catalogRef = (i: { type?: string | null, michelNo?: string | null }) => i?.michelNo ? `${catalogShort(i.type || 'stamp')} ${i.michelNo}` : ''
export const AREAS_COINS = ['BRD Euro', 'BRD DM', 'DDR Mark', 'Deutsches Reich', 'Kaiserreich', 'Euro Ausland']

export const AREAS = ['Deutsches Reich', 'Bizone', 'Saarland', 'Bund', 'Berlin', 'DDR']

export function useLabels() {
  const cond = (v: string) => CONDITIONS.find(c => c.value === v) ?? CONDITIONS[4]
  const status = (v: string) => STATUSES.find(s => s.value === v)?.label ?? v
  const type = (v: string) => TYPES.find(t => t.value === v)?.label ?? v
  const eur = (v: unknown) => v == null || v === '' ? '' : Number(v).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  const imgUrl = (fileKey: string, variant: 'web' | 'thumb' = 'thumb') => `/api/files/${fileKey}-${variant}.webp`
  return { cond, status, type, eur, imgUrl }
}
