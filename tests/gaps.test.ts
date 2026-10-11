import { describe, expect, it } from 'vitest'
import { catalogNumber, findGaps, formatRanges, type GapItem } from '../server/utils/gaps'

const item = (michelNo: string, extra: Partial<GapItem> = {}): GapItem => ({ area: 'Bund', year: 1960, michelNo, type: 'stamp', series: '', condition: 'mnh', ...extra })

describe('catalogNumber', () => {
  it('liest die führende Zahl', () => {
    expect(catalogNumber('320')).toBe(320)
    expect(catalogNumber('320a')).toBe(320)
    expect(catalogNumber('Block 5')).toBe(5)
    expect(catalogNumber('1234-1236')).toBe(1234)
    expect(catalogNumber(' 42 ')).toBe(42)
  })
  it('gibt null ohne brauchbare Zahl', () => {
    expect(catalogNumber('')).toBeNull()
    expect(catalogNumber('ohne')).toBeNull()
    expect(catalogNumber('0')).toBeNull()
    expect(catalogNumber('999999')).toBeNull()
  })
})

describe('findGaps', () => {
  it('findet fehlende Nummern zwischen vorhandenen', () => {
    const g = findGaps([item('320'), item('321'), item('324'), item('325')])
    expect(g).toHaveLength(1)
    expect(g[0]!.missing).toEqual([322, 323])
    expect(g[0]!.have).toBe(4)
    expect(g[0]!.min).toBe(320)
    expect(g[0]!.max).toBe(325)
  })
  it('überspringt zu große Abstände', () => {
    const g = findGaps([item('10'), item('11'), item('400')], { maxRun: 10 })
    expect(g).toHaveLength(0)
  })
  it('braucht genug vorhandene Nummern', () => {
    expect(findGaps([item('10'), item('12')])).toHaveLength(0)
    expect(findGaps([item('10'), item('12')], { minHave: 2 })[0]!.missing).toEqual([11])
  })
  it('trennt Gebiete, Typen und Serien', () => {
    const g = findGaps([
      item('1'), item('3'), item('4'),
      item('1', { area: 'DDR' }), item('3', { area: 'DDR' }), item('4', { area: 'DDR' }),
    ])
    expect(g).toHaveLength(2)
    expect(g.map(x => x.area).sort()).toEqual(['Bund', 'DDR'])
    const mitSerie = findGaps([item('1'), item('3'), item('4', { series: 'Olympia' })])
    expect(mitSerie).toHaveLength(0)
  })
  it('zählt doppelte Nummern nur einmal und sortiert nach Anzahl der Lücken', () => {
    const g = findGaps([
      item('1'), item('1'), item('2'), item('5'),
      item('1', { area: 'DDR' }), item('2', { area: 'DDR' }), item('4', { area: 'DDR' }),
    ])
    expect(g[0]!.area).toBe('Bund')
    expect(g[0]!.missing).toEqual([3, 4])
    expect(g[1]!.missing).toEqual([3])
  })
  it('begrenzt die Anzahl je Gruppe', () => {
    const items = [item('1'), item('20'), item('40')]
    const g = findGaps(items, { maxRun: 30, maxPerGroup: 5 })
    expect(g[0]!.missing).toHaveLength(5)
  })
})

describe('formatRanges', () => {
  it('fasst Folgen zusammen', () => {
    expect(formatRanges([3, 4, 5, 9])).toBe('3–5, 9')
    expect(formatRanges([7])).toBe('7')
    expect(formatRanges([])).toBe('')
    expect(formatRanges([2, 1, 3])).toBe('1–3')
  })
})

import { catalogRef, catalogShort } from '../app/composables/useLabels'
describe('Katalogkürzel', () => {
  it('nutzt Jaeger für Münzen, Rosenberg für Banknoten, Michel sonst', () => {
    expect(catalogShort('stamp')).toBe('Mi')
    expect(catalogShort('coin')).toBe('J.')
    expect(catalogShort('coin_set')).toBe('J.')
    expect(catalogShort('banknote')).toBe('R.')
    expect(catalogShort(undefined)).toBe('Mi')
    expect(catalogRef({ type: 'coin', michelNo: '388' })).toBe('J. 388')
    expect(catalogRef({ type: 'stamp', michelNo: '519' })).toBe('Mi 519')
    expect(catalogRef({ type: 'stamp', michelNo: '' })).toBe('')
    expect(catalogRef({ michelNo: null } as any)).toBe('')
  })
})

describe('Upload-Pfade der Guard-Middleware', () => {
  const isUpload = (path: string) => /\/(captures|images|scan)\b/.test(path)
  it('erlaubt große Bodies nur auf Foto-Endpunkten', () => {
    expect(isUpload('/api/captures')).toBe(true)
    expect(isUpload('/api/items/abc/images')).toBe(true)
    expect(isUpload('/api/wishlist/scan')).toBe(true)
    expect(isUpload('/api/items')).toBe(false)
    expect(isUpload('/api/ai/config')).toBe(false)
    expect(isUpload('/api/scanner-fake')).toBe(false)
  })
})
