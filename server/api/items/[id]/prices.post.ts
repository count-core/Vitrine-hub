import { db, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  await requireOwnedItem(id, user.id)
  const b = await readBody<{ kind?: string, source: string, price: string | number, priceMax?: string | number, condition?: string, observedAt?: string, url?: string, note?: string }>(event)
  const price = Number(String(b?.price ?? '').replace(',', '.'))
  if (!Number.isFinite(price) || price < 0) throw createError({ statusCode: 400, statusMessage: 'Preis fehlt oder ungültig' })
  const priceMax = b.priceMax != null && b.priceMax !== '' ? Number(String(b.priceMax).replace(',', '.')) : null
  const [row] = await db.insert(schema.priceObservation).values({
    itemId: id, ownerId: user.id, kind: (['observed', 'sold', 'catalog'].includes(b.kind || '') ? b.kind : 'observed') as any,
    source: (b.source || '').slice(0, 120), price: price.toFixed(2), priceMax: priceMax != null && Number.isFinite(priceMax) ? priceMax.toFixed(2) : null,
    condition: (b.condition as any) || null, observedAt: b.observedAt ? new Date(b.observedAt) : new Date(), url: (b.url || '').slice(0, 1000), note: (b.note || '').slice(0, 1000),
  }).returning()
  return row
})
