import { describe, expect, it } from 'vitest'
import { median, researchLinks, summarizePrices } from '../server/utils/prices'
import { parseEstimate, buildEstimatePrompt } from '../server/utils/ai/estimate'

describe('median', () => {
  it('berechnet Median für gerade und ungerade Anzahl', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
  })
})

describe('summarizePrices', () => {
  it('zählt nur echte Beobachtungen in Min/Median/Max, KI separat', () => {
    const s = summarizePrices([
      { kind: 'observed', price: '1.50' }, { kind: 'sold', price: '2.00' }, { kind: 'observed', price: '0.80' },
      { kind: 'ai_estimate', price: '1.00', priceMax: '3.00' },
    ])
    expect(s.count).toBe(3); expect(s.min).toBe(0.8); expect(s.median).toBe(1.5); expect(s.max).toBe(2)
    expect(s.aiEstimate).toBe(2); expect(s.aiCount).toBe(1)
  })
})

describe('researchLinks', () => {
  it('baut eine Suchanfrage mit Michel-Nr. und Erhaltung', () => {
    const l = researchLinks({ area: 'DDR', michelNo: '2347', motif: 'Kupferstich', year: 1978, condition: 'mnh' })
    expect(l.query).toBe('DDR Mi 2347 1978 postfrisch')
    expect(l.ebaySold).toContain('LH_Sold=1')
    expect(l.ebaySold).toContain(encodeURIComponent('Mi 2347'))
  })
})

describe('researchLinks Münzen', () => {
  it('nutzt Münzbegriffe, Erhaltungsgrad und eBay-Münzkategorie', () => {
    const l = researchLinks({ area: 'BRD DM', michelNo: '', motif: 'Fichte', year: 1958, condition: 'unknown', type: 'coin', grade: 'st', faceValue: '5 DM' })
    expect(l.query).toBe('BRD 5 DM Fichte 1958 Münze st')
    expect(l.query).not.toContain('postfrisch')
    expect(l.ebaySold).toContain('_sacat=11116')
    expect(l.philasearch).toContain('ma-shops')
  })
})

describe('parseEstimate', () => {
  it('liest JSON aus Freitext und validiert', () => {
    const e = parseEstimate('Hier: {"katalogwert_postfrisch_eur": 0.6, "marktwert_min_eur": 0.1, "marktwert_max_eur": 0.5, "konfidenz": 0.7, "begruendung": "Massenware"} Ende')
    expect(e.katalogwert_postfrisch_eur).toBe(0.6); expect(e.konfidenz).toBe(0.7)
  })
  it('fällt bei Unsinn auf Konfidenz 0 zurück', () => {
    expect(parseEstimate('keine Ahnung').konfidenz).toBe(0)
    expect(parseEstimate('{"konfidenz": 5}').konfidenz).toBe(0)
  })
  it('Prompt enthält Marke und Erhaltung', () => {
    expect(buildEstimatePrompt({ area: 'Bund', country: '', year: 1972, michelNo: '734', faceValue: '25 Pf', motif: 'Olympiade', condition: 'mnh', type: 'stamp', quantity: 1 })).toContain('Michel-Nr. 734')
  })
})
