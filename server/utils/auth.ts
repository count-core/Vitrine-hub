import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db, schema } from '../db'

/** Coolify liefert Domains teils ohne Protokoll, Better Auth braucht eine vollständige URL. */
function baseURL() {
  const raw = (process.env.BETTER_AUTH_URL || 'http://localhost:3000').trim().replace(/\/$/, '')
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`
}

export const auth = betterAuth({
  baseURL: baseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 8,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') return
      if (process.env.ALLOW_SIGNUP === 'true') return
      const code = ctx.headers?.get('x-invite-code') || ''
      if (!(await validInvite(code))) throw new APIError('FORBIDDEN', { message: 'Registrierung nur mit gültiger Einladung' })
    }),
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 240,
    customRules: {
      // Anmeldung und Registrierung eng, damit Passwörter nicht durchprobiert werden
      '/sign-in/email': { window: 60, max: 8 },
      '/sign-up/email': { window: 300, max: 5 },
      '/forget-password': { window: 300, max: 5 },
      // Die Sitzungsabfrage läuft bei jedem Seitenwechsel, sie darf nicht limitiert werden
      '/get-session': { window: 60, max: 1000 },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: process.env.NODE_ENV === 'production' ? [baseURL()] : ['http://localhost:3000', 'http://127.0.0.1:3000', baseURL()],
})

export type Session = typeof auth.$Infer.Session
