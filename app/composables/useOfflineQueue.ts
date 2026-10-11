/** Offline-Warteschlange für Fotos in IndexedDB. Wird beim nächsten Online-Besuch der Erfassen-Seite abgearbeitet. */
const DB = 'marken-hub', STORE = 'queue'
function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
}
export interface QueuedPhoto { id: string, file: Blob, name: string, hint: string, mode: string, album: string, sheet: string, addedAt: number }
export function useOfflineQueue() {
  const count = ref(0)
  async function all(): Promise<QueuedPhoto[]> { try { const db = await open(); return await new Promise((res, rej) => { const r = db.transaction(STORE).objectStore(STORE).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) }) } catch { return [] } }
  async function refresh() { count.value = (await all()).length }
  async function add(p: Omit<QueuedPhoto, 'id' | 'addedAt'>) { const db = await open(); await new Promise<void>((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put({ ...p, id: crypto.randomUUID(), addedAt: Date.now() }); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) }); await refresh() }
  async function remove(id: string) { const db = await open(); await new Promise<void>((res) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); tx.oncomplete = () => res() }); await refresh() }
  return { count, all, add, remove, refresh }
}
