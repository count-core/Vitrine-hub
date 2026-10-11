import { describe, expect, it } from 'vitest'
import { findMatches, motifKey, verdictFor, type Candidate, type Detected } from '../server/utils/match'

const c = (o: Partial<Candidate>): Candidate => ({ id: 'x', area: 'DDR', year: 1978, michelNo: '2323', motif: 'Landsknecht', faceValue: '10 Pf', type: 'stamp', quantity: 1, status: 'collection', ...o })
const d = (o: Partial<Detected> = {}): Detected => ({ area: 'DDR', year: 1978, michelNo: '2323', motif: 'Landsknecht', faceValue: '10 Pf', type: 'stamp', ...o })

describe('motifKey', () => {
  it('lässt Klammerzusätze und Zusatzangaben weg', () => {
    expect(motifKey('Sitzende Frau (Jean Antoine Watteau)')).toBe('sitzendefrau')
    expect(motifKey('Landsknecht mit Hellebarde, 1520')).toBe('landsknechtmithellebarde')
    expect(motifKey('')).toBe('')
  })
})

describe('findMatches', () => {
  it('trifft über die Katalognummer', () => {
    const r = findMatches(d(), [c({ id: 'a' })])
    expect(r.by).toBe('number')
    expect(r.matches[0]!.id).toBe('a')
  })
  it('trifft über das Motiv, wenn die KI eine andere Nummer rät', () => {
    const r = findMatches(d({ michelNo: '2345', motif: 'Landsknecht mit Hellebarde (Hans Schäufelein)' }), [c({ id: 'b', motif: 'Landsknecht' })])
    expect(r.by).toBe('motif')
    expect(r.matches[0]!.id).toBe('b')
  })
  it('trifft über Nennwert und Jahr als letzte Brücke', () => {
    const r = findMatches(d({ michelNo: '', motif: 'unklar' }), [c({ id: 'c', motif: '' })])
    expect(r.by).toBe('value')
  })
  it('trennt Gebiete und Typen', () => {
    expect(findMatches(d(), [c({ area: 'Bund' })]).by).toBe('none')
    expect(findMatches(d({ type: 'coin' }), [c({ type: 'stamp' })]).by).toBe('none')
    expect(findMatches(d({ type: 'coin' }), [c({ type: 'coin_set', motif: 'Landsknecht' })]).by).toBe('number')
  })
  it('erlaubt ein Jahr Abweichung, aber nicht mehr', () => {
    expect(findMatches(d({ year: 1979 }), [c()]).by).toBe('number')
    expect(findMatches(d({ year: 1985 }), [c()]).by).toBe('none')
  })
  it('meldet nichts bei zu kurzem Motiv ohne Nummer', () => {
    expect(findMatches(d({ michelNo: '', motif: 'Tor', faceValue: '' }), [c({ michelNo: '', motif: 'Tor' })]).by).toBe('none')
  })
})

describe('verdictFor', () => {
  it('unterscheidet Bestand, Wunsch und neu', () => {
    expect(verdictFor(d(), [c({ quantity: 3 })]).verdict).toBe('owned')
    expect(verdictFor(d(), [c({ quantity: 3 })]).ownedQuantity).toBe(3)
    expect(verdictFor(d(), [c({ status: 'wanted' })]).verdict).toBe('wanted')
    expect(verdictFor(d(), []).verdict).toBe('new')
    expect(verdictFor(d(), [c({ status: 'sold' })]).verdict).toBe('new')
  })
  it('zählt Bestand über mehrere Treffer zusammen und bevorzugt Bestand vor Wunsch', () => {
    const r = verdictFor(d(), [c({ id: 'a', quantity: 2 }), c({ id: 'b', quantity: 1, status: 'wanted' })])
    expect(r.verdict).toBe('owned')
    expect(r.ownedQuantity).toBe(2)
    expect(r.itemId).toBe('a')
  })
})
