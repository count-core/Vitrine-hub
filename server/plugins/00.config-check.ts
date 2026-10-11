/** Prüft beim Start die wichtigsten Betreiber-Einstellungen. In Produktion bricht ein fehlendes Secret den Start ab. */
export default defineNitroPlugin(() => {
  const prod = process.env.NODE_ENV === 'production'
  const secret = process.env.BETTER_AUTH_SECRET || ''
  const problems: string[] = []
  if (!secret || secret.length < 32 || /ersetzen|changeme|secret$/i.test(secret)) problems.push('BETTER_AUTH_SECRET fehlt oder ist zu kurz (mindestens 32 zufällige Zeichen)')
  if (!process.env.DATABASE_URL) problems.push('DATABASE_URL fehlt')
  if (prod && !/^https:\/\//.test(process.env.BETTER_AUTH_URL || '')) console.warn('[config] BETTER_AUTH_URL beginnt nicht mit https://, Cookies sind dann nicht als secure markiert.')
  if (prod && process.env.ALLOW_SIGNUP === 'true') console.warn('[config] ALLOW_SIGNUP=true: jeder kann sich registrieren. Nach dem Anlegen der Konten auf false setzen.')
  if (!process.env.LEGAL_NAME) console.warn('[config] LEGAL_NAME fehlt: Impressum und Datenschutz zeigen Platzhalter.')
  if (problems.length) {
    for (const p of problems) console.error('[config]', p)
    if (prod) process.exit(1)
  }
})
