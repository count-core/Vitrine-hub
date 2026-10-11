import { mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises'
import { dirname, join, normalize } from 'node:path'

/** Kleiner Speicher-Adapter. Aktuell lokales Volume. Später S3 mit gleicher Schnittstelle. */
export interface Storage {
  put(key: string, data: Buffer): Promise<void>
  get(key: string): Promise<Buffer>
  path(key: string): string
  exists(key: string): Promise<boolean>
  delete(key: string): Promise<void>
}

function baseDir() {
  return useRuntimeConfig().uploadDir as string
}

function safeKey(key: string) {
  const n = normalize(key).replace(/^(\.\.[/\\])+/, '')
  if (n.includes('..')) throw createError({ statusCode: 400, statusMessage: 'Ungültiger Schlüssel' })
  return n
}

export const storage: Storage = {
  async put(key, data) {
    const p = join(baseDir(), safeKey(key))
    await mkdir(dirname(p), { recursive: true })
    await writeFile(p, data)
  },
  async get(key) { return readFile(join(baseDir(), safeKey(key))) },
  path(key) { return join(baseDir(), safeKey(key)) },
  async exists(key) { try { await stat(join(baseDir(), safeKey(key))); return true } catch { return false } },
  async delete(key) { await rm(join(baseDir(), safeKey(key)), { force: true }) },
}
