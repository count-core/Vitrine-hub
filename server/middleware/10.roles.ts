/** Leserechte-Nutzer dürfen nichts verändern. Owner-only-Routen prüfen selbst. */
export default defineEventHandler(async (event) => {
  const m = event.method
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return
  const p = event.path
  if (!p.startsWith('/api/') || p.startsWith('/api/auth') || p.startsWith('/api/public') || p.startsWith('/api/invites/redeem')) return
  await requireRole(event, 'editor')
})
