import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/** AES-256-GCM mit einem aus BETTER_AUTH_SECRET abgeleiteten Schlüssel. Für API-Keys der Nutzer in der Datenbank. */
function key(secret = process.env.AI_KEY_SECRET || process.env.BETTER_AUTH_SECRET || '') {
  if (!secret) throw new Error('BETTER_AUTH_SECRET fehlt, kann Schlüssel nicht verschlüsseln')
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plain: string, secret?: string): string {
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), enc.toString('base64url')].join(':')
}

export function decryptSecret(stored: string, secret?: string): string {
  if (!stored) return ''
  const [v, iv, tag, data] = stored.split(':')
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unbekanntes Schlüsselformat')
  const decipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
}

/** Letzte 4 Zeichen zum Wiedererkennen, Rest maskiert. */
export function maskSecret(plain: string) {
  if (!plain) return ''
  return plain.length <= 6 ? '••••' : `••••${plain.slice(-4)}`
}
