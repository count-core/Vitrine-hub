export interface SessionUser { id: string, name: string, email: string }

/**
 * Session serverseitig mit weitergereichten Cookies holen, clientseitig direkt.
 * Nur eine echte 401 bedeutet "nicht angemeldet". Bei Netzwerkproblemen oder einem
 * Rate-Limit (429) bleibt der zuletzt bekannte Nutzer stehen, damit niemand mitten
 * im Blättern aus der App fliegt.
 */
export async function fetchSessionUser(): Promise<SessionUser | null> {
  const cached = useState<SessionUser | null>('session-user', () => null)
  const fetcher = import.meta.server ? useRequestFetch() : $fetch
  try {
    const data = await fetcher<{ user?: SessionUser } | null>('/api/auth/get-session')
    cached.value = data?.user ?? null
    return cached.value
  } catch (e: any) {
    const status = e?.status ?? e?.statusCode ?? e?.response?.status
    if (status === 401 || status === 403) { cached.value = null; return null }
    return cached.value
  }
}

/** Nach dem Abmelden den gemerkten Nutzer verwerfen. */
export function clearSessionUser() {
  useState<SessionUser | null>('session-user', () => null).value = null
}
