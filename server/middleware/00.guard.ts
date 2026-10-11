const PROD = process.env.NODE_ENV === 'production'
/** Inline-Skripte und -Styles braucht Nuxt/Nuxt UI (Hydration-Payload, Tailwind-Variablen); alles andere nur von der eigenen Origin. */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

/** Security-Header und Body-Größenlimit vor dem Parsen (Schutz vor RAM-Erschöpfung). */
export default defineEventHandler((event) => {
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  })
  if (PROD) {
    setHeader(event, 'Content-Security-Policy', CSP)
    const proto = getHeader(event, 'x-forwarded-proto') || ''
    if (proto === 'https') setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  const len = Number(getHeader(event, 'content-length') || 0)
  // Foto-Endpunkte dürfen große Bodies haben, alles andere bleibt klein
  const isUpload = /\/(captures|images|scan)\b/.test(event.path)
  const max = event.path.startsWith('/api/public') ? 64_000 : isUpload ? 20_000_000 : 2_000_000
  if (len > max) throw createError({ statusCode: 413, statusMessage: 'Anfrage zu groß' })
})
