import { randomInt } from 'node:crypto'
import { db, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const { collection } = await requireRole(event, 'owner')
  const b = await readBody<{ role?: string, label?: string, days?: number }>(event)
  const role = b?.role === 'editor' ? 'editor' : 'viewer'
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 Zeichen, 16 Stellen = 80 Bit Entropie
  const code = Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join('')
  const [row] = await db.insert(schema.invite).values({ collectionId: collection.id, code, role, label: (b?.label || '').slice(0, 80), expiresAt: new Date(Date.now() + Math.min(30, Math.max(1, Number(b?.days) || 7)) * 86400_000) }).returning()
  return row
})
