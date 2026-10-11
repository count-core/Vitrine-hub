import { and, eq, gt, isNull } from 'drizzle-orm'
import { db, schema } from '../db'

export async function validInvite(code: string | undefined) {
  const c = (code || '').trim().toUpperCase()
  if (!/^[A-Z0-9]{10,24}$/.test(c)) return null
  return db.query.invite.findFirst({ where: and(eq(schema.invite.code, c), isNull(schema.invite.usedAt), gt(schema.invite.expiresAt, new Date())), with: { collection: true } })
}
