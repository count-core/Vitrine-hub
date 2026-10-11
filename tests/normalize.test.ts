import { describe, expect, it } from 'vitest'
import { boxIsPlausible, mapCondition, normalizeResponse, normalizeYear } from '../server/utils/ai/normalize'

describe('boxIsPlausible', () => {
  it('akzeptiert Rahmen im Bereich 0..1000 mit Mindestgröße', () => {
    expect(boxIsPlausible([100, 100, 300, 260])).toBe(true)
  })
  it('lehnt zu kleine, negative oder falsche Rahmen ab', () => {
    expect(boxIsPlausible([36, 25, 50, 94])).toBe(false)
    expect(boxIsPlausible([0, 0, 1200, 500])).toBe(false)
    expect(boxIsPlausible([1, 2, 3])).toBe(false)
    expect(boxIsPlausible(null)).toBe(false)
  })
})

describe('normalizeYear', () => {
  it('verwirft Geburtsjahre von Malern und Zukunft', () => {
    expect(normalizeYear(1668, 2026)).toBeNull()
    expect(normalizeYear(2030, 2026)).toBeNull()
    expect(normalizeYear('1972', 2026)).toBe(1972)
    expect(normalizeYear(undefined, 2026)).toBeNull()
  })
})

describe('mapCondition', () => {
  it('bildet Michel-Symbole auf Enum ab', () => {
    expect(mapCondition('**')).toBe('mnh')
    expect(mapCondition('o')).toBe('used')
    expect(mapCondition('(*)')).toBe('no_gum')
    expect(mapCondition('irgendwas')).toBe('unknown')
  })
})

describe('normalizeResponse', () => {
  it('sortiert plausible Rahmen nach Leserichtung und nummeriert', () => {
    const raw = { stamps: [
      { box_2d: [500, 100, 700, 250], land: 'DDR', sammelgebiet: 'DDR', jahr: 1978, nennwert: '20', motiv: 'B', erhaltung: 'unklar', konfidenz: 0.9 },
      { box_2d: [100, 600, 300, 750], land: 'DDR', sammelgebiet: 'DDR', jahr: 1978, nennwert: '10', motiv: 'A2', erhaltung: 'o', konfidenz: 0.9 },
      { box_2d: [100, 100, 300, 250], land: 'DDR', sammelgebiet: 'DDR', jahr: 1978, nennwert: '5', motiv: 'A1', erhaltung: 'o', konfidenz: 0.9 },
    ] }
    const out = normalizeResponse(raw, 2026)
    expect(out.map(s => s.motif)).toEqual(['A1', 'A2', 'B'])
    expect(out.map(s => s.position)).toEqual([1, 2, 3])
    expect(out[1].condition).toBe('used')
  })
  it('markiert unbrauchbare Rahmen und senkt Konfidenz bei unplausiblem Jahr', () => {
    const raw = { stamps: [
      { box_2d: [36, 25, 50, 94], land: 'DDR', sammelgebiet: 'DDR', jahr: 1668, nennwert: '10', motiv: 'X', erhaltung: 'o', konfidenz: 0.95 },
    ] }
    const [s] = normalizeResponse(raw, 2026)
    expect(s.boxOk).toBe(false)
    expect(s.box).toBeNull()
    expect(s.year).toBeNull()
    expect(s.confidence).toBeLessThanOrEqual(0.5)
    expect(s.hint).toContain('Rahmen')
    expect(s.hint).toContain('1668')
  })
  it('wertet doppelt erkannte Marken mit gleichem Rahmen ab', () => {
    const raw = { stamps: [
      { box_2d: [34, 163, 275, 480], land: 'DR', sammelgebiet: 'Deutsches Reich', jahr: 1923, nennwert: '125', motiv: 'Ziffer', erhaltung: 'o', konfidenz: 0.8 },
      { box_2d: [34, 163, 275, 480], land: 'DR', sammelgebiet: 'Deutsches Reich', jahr: 1923, nennwert: '50', motiv: 'Ziffer', erhaltung: 'o', konfidenz: 0.7 },
    ] }
    const out = normalizeResponse(raw, 2026)
    expect(out[0].confidence).toBe(0.8)
    expect(out[1].confidence).toBeLessThanOrEqual(0.3)
    expect(out[1].hint).toContain('doppelt')
  })
  it('liefert leere Liste bei kaputter Antwort', () => {
    expect(normalizeResponse({ foo: 1 })).toEqual([])
    expect(normalizeResponse(null)).toEqual([])
  })
})

describe('Münzen und Sätze', () => {
  it('bildet Münztypen, Erhaltungsgrad und Serie ab', () => {
    const raw = { stamps: [
      { box_2d: [100, 100, 400, 400], typ: 'muenze', land: 'Deutschland', sammelgebiet: 'BRD Euro', jahr: 2020, nennwert: '20 Euro', motiv: 'Berlin', erhaltung: 'unklar', erhaltung_muenze: 'st', material: 'Silber 925', praegestaette: 'A', serie: '20-Euro-Sammlermünzen 2020', konfidenz: 0.8 },
      { box_2d: [500, 100, 900, 900], typ: 'muenzsatz', land: 'Deutschland', sammelgebiet: 'BRD Euro', jahr: 2020, nennwert: '5 x 20 Euro', motiv: 'Set', erhaltung: 'unklar', anzahl: 5, konfidenz: 0.9 },
    ] }
    const out = normalizeResponse(raw, 2026)
    expect(out[0].type).toBe('coin'); expect(out[0].grade).toBe('st'); expect(out[0].mint).toBe('A'); expect(out[0].condition).toBe('unknown'); expect(out[0].series).toContain('20-Euro')
    expect(out[1].type).toBe('coin_set'); expect(out[1].pieces).toBe(5)
  })
  it('lässt Marken unverändert als stamp mit Erhaltung', () => {
    const [s] = normalizeResponse({ stamps: [{ box_2d: [100, 100, 400, 400], land: 'DDR', sammelgebiet: 'DDR', jahr: 1978, nennwert: '10 Pf', motiv: 'x', erhaltung: 'o', konfidenz: 0.9 }] }, 2026)
    expect(s.type).toBe('stamp'); expect(s.condition).toBe('used'); expect(s.grade).toBe('')
  })
})
