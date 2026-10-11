export interface PriceLike { price: string | number | null, priceMax?: string | number | null, kind: string }

export function median(values: number[]): number | null {
  const v = values.filter(n => Number.isFinite(n)).sort((a, b) => a - b)
  if (!v.length) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid]! : (v[mid - 1]! + v[mid]!) / 2
}

/** Zusammenfassung der Beobachtungen: KI-Schätzungen zählen nicht in Min/Median/Max, nur echte Beobachtungen. */
export function summarizePrices(rows: PriceLike[]) {
  const observed = rows.filter(r => r.kind === 'observed' || r.kind === 'sold').map(r => Number(r.price)).filter(n => Number.isFinite(n) && n > 0)
  const ai = rows.filter(r => r.kind === 'ai_estimate')
  const aiMid = ai.length ? median(ai.map(r => { const a = Number(r.price), b = Number(r.priceMax ?? r.price); return Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : a })) : null
  return {
    count: observed.length,
    min: observed.length ? Math.min(...observed) : null,
    median: median(observed),
    max: observed.length ? Math.max(...observed) : null,
    aiEstimate: aiMid,
    aiCount: ai.length,
  }
}

/** Suchlinks mit vorgefüllter Anfrage für die manuelle Recherche. */
export function researchLinks(i: { area: string, michelNo: string, motif: string, year: number | null, condition: string, type?: string, grade?: string, faceValue?: string }) {
  const coin = i.type === 'coin' || i.type === 'coin_set'
  const cond = coin ? (i.grade ? i.grade : '') : i.condition === 'mnh' ? 'postfrisch' : i.condition === 'used' ? 'gestempelt' : ''
  const area = coin ? i.area.replace(/^BRD Euro$/, 'Deutschland').replace(/^BRD DM$/, 'BRD').replace(/^DDR Mark$/, 'DDR') : i.area
  const q = coin
    ? [area, i.faceValue || '', i.michelNo ? `Jaeger ${i.michelNo}` : i.motif, i.year || '', i.type === 'coin_set' ? 'Münzsatz' : 'Münze', cond].filter(Boolean).join(' ')
    : [area, i.michelNo ? `Mi ${i.michelNo}` : i.motif, i.year || '', cond].filter(Boolean).join(' ')
  const e = encodeURIComponent(q)
  const cat = coin ? '&_sacat=11116' : '&_sacat=260'
  return {
    query: q,
    ebaySold: `https://www.ebay.de/sch/i.html?_nkw=${e}${cat}&LH_Sold=1&LH_Complete=1&_sop=13`,
    ebayActive: `https://www.ebay.de/sch/i.html?_nkw=${e}${cat}&_sop=15`,
    delcampe: `https://www.delcampe.net/de/sammlerobjekte/search?term=${e}&categories%5B%5D=${coin ? '2' : '1'}`,
    philasearch: coin ? `https://www.ma-shops.de/search.php?searchstr=${e}` : `https://www.philasearch.com/de/search?q=${e}`,
    catawiki: `https://www.catawiki.com/de/s?q=${e}`,
    colnect: `https://colnect.com/de/${coin ? 'coins' : 'stamps'}/list/search/${e}`,
  }
}
