import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Prüft eine vom Eigentümer eingetragene Basis-Adresse (nur Ollama und eigener Server).
 * Loopback und private Netze sind erlaubt, weil Ollama genau dort läuft. Gesperrt sind
 * Link-Local-Adressen (Cloud-Metadaten 169.254.x.x, fe80::), 0.0.0.0 und alles außer http(s).
 */
export async function assertSafeBaseUrl(raw: string) {
  let u: URL
  try { u = new URL(raw) } catch { throw createError({ statusCode: 400, statusMessage: 'Adresse ist keine gültige URL' }) }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw createError({ statusCode: 400, statusMessage: 'Adresse muss mit http:// oder https:// beginnen' })
  if (u.username || u.password) throw createError({ statusCode: 400, statusMessage: 'Adresse darf keine Zugangsdaten enthalten' })
  const host = u.hostname.replace(/^\[|\]$/g, '')
  if (/metadata|\.internal$/i.test(host)) throw createError({ statusCode: 400, statusMessage: 'Diese Adresse ist nicht erlaubt' })
  const addrs = isIP(host) ? [host] : await lookup(host, { all: true }).then(r => r.map(a => a.address)).catch(() => { throw createError({ statusCode: 400, statusMessage: 'Adresse lässt sich nicht auflösen' }) })
  for (const a of addrs) if (isBlockedAddress(a)) throw createError({ statusCode: 400, statusMessage: 'Diese Adresse ist nicht erlaubt (Link-Local oder unspezifisch)' })
  return u.toString().replace(/\/$/, '')
}

/** IPv6 in 8 Gruppen (Zahlen) expandieren, eingebettetes Dotted-IPv4 am Ende inklusive. null bei ungültiger Adresse. */
function expandV6(ip: string): number[] | null {
  let str = ip
  const m = str.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (m) {
    const o = m[2]!.split('.').map(Number)
    if (o.some(x => x > 255)) return null
    str = `${m[1]}${((o[0]! << 8) | o[1]!).toString(16)}:${((o[2]! << 8) | o[3]!).toString(16)}`
  }
  const halves = str.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  if (halves.length === 1 && head.length !== 8) return null
  const fill = 8 - head.length - tail.length
  if (fill < 0) return null
  const groups = [...head, ...Array(halves.length === 2 ? fill : 0).fill('0'), ...tail]
  if (groups.length !== 8 || groups.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null
  return groups.map(g => parseInt(g, 16))
}

/** IPv6-gemappte (::ffff:1.2.3.4, ::ffff:0102:0304) oder IPv4-kompatible (::1.2.3.4) Adressen auf Dotted-Decimal bringen. */
export function normalizeAddress(ip: string) {
  const low = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '')
  if (isIP(low) === 4) return low
  const g = expandV6(low)
  if (!g) return low
  const zeroPrefix = (n: number) => g.slice(0, n).every(x => x === 0)
  const mapped = zeroPrefix(5) && g[5] === 0xffff
  const compat = zeroPrefix(6) && (g[6] !== 0 || g[7]! > 1) // ::1 bleibt Loopback v6, :: bleibt unspezifisch
  if (mapped || compat) return `${g[6]! >> 8}.${g[6]! & 255}.${g[7]! >> 8}.${g[7]! & 255}`
  return low
}

export function isBlockedAddress(ip: string) {
  const n = normalizeAddress(ip)
  if (isIP(n) === 4) {
    const [a, b] = n.split('.').map(Number)
    return a === 0 || (a === 169 && b === 254)
  }
  if (isIP(n) !== 6) return true // unbekanntes Format lieber sperren
  return n === '::' || /^fe[89ab][0-9a-f]:/.test(n) || /^0*::$/.test(n)
}
