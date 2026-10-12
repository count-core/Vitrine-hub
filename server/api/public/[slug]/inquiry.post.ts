import { and, count, eq, gt, ne } from 'drizzle-orm'
import { db, schema } from '../../../db'

const recent = new Map<string, number[]>()

export default defineEventHandler(async (event) => {
  const c = await findPublicCollection(getRouterParam(event, 'slug')!)
  if (!c || !c.allowInquiries) throw createError({ statusCode: 404, statusMessage: 'Anfragen sind nicht möglich' })
  const b = await readBody<{ name?: string, email?: string, message?: string, itemId?: string, kind?: string, offerPrice?: string | number, website?: string }>(event)
  if (b?.website) return { ok: true } // Honeypot
  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  const now = Date.now(); const hits = (recent.get(ip) || []).filter(t => now - t < 3600_000)
  if (recent.size > 5000) for (const [k, v] of recent) if (!v.some(t => now - t < 3600_000)) recent.delete(k)
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(schema.inquiry).where(and(eq(schema.inquiry.collectionId, c.id), gt(schema.inquiry.createdAt, new Date(now - 3600_000))))
  if (n >= 30) throw createError({ statusCode: 429, statusMessage: 'Zu viele Anfragen für diese Sammlung, bitte später erneut' })
  if (hits.length >= 5) throw createError({ statusCode: 429, statusMessage: 'Zu viele Anfragen, bitte später erneut' })
  recent.set(ip, [...hits, now])
  const email = (b.email || '').trim(), message = (b.message || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Bitte eine gültige E-Mail angeben' })
  if (message.length < 5) throw createError({ statusCode: 400, statusMessage: 'Bitte eine Nachricht schreiben' })
  const offer = b.offerPrice != null && b.offerPrice !== '' ? Number(String(b.offerPrice).replace(',', '.')) : null
  const itemId = b.itemId && /^[0-9a-f-]{36}$/i.test(b.itemId) ? (await db.query.item.findFirst({ where: and(eq(schema.item.id, b.itemId), eq(schema.item.collectionId, c.id), ne(schema.item.visibility, 'hidden')), columns: { id: true } }))?.id ?? null : null
  const ipShort = ip.includes(':') ? ip.split(':').slice(0, 4).join(':') + '::' : ip.replace(/\.\d+$/, '.0')
  await db.insert(schema.inquiry).values({ collectionId: c.id, itemId, kind: ['question', 'offer', 'have'].includes(b.kind || '') ? b.kind! : 'question', name: (b.name || '').slice(0, 120), email: email.slice(0, 200), message: message.slice(0, 2000), offerPrice: offer != null && Number.isFinite(offer) ? offer.toFixed(2) : null, ip: ipShort })
  return { ok: true }
})
