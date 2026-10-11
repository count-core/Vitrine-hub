// Wendet die SQL-Migrationen aus server/db/migrations auf DATABASE_URL an (ohne drizzle-kit, ohne Prompts).
import { readdir, readFile } from 'node:fs/promises'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL fehlt'); process.exit(1) }
const sql = postgres(url, { max: 1 })
try {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)`
  const journal = JSON.parse(await readFile('server/db/migrations/meta/_journal.json', 'utf8'))
  const done = new Set((await sql`SELECT hash FROM drizzle.__drizzle_migrations`).map(r => r.hash))
  const { createHash } = await import('node:crypto')
  for (const e of journal.entries) {
    const text = await readFile(`server/db/migrations/${e.tag}.sql`, 'utf8')
    const hash = createHash('sha256').update(text).digest('hex')
    if (done.has(hash)) continue
    for (const stmt of text.split('--> statement-breakpoint')) if (stmt.trim()) await sql.unsafe(stmt)
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${e.when})`
    console.log('angewendet:', e.tag)
  }
  console.log('Datenbank ist aktuell')
} finally { await sql.end() }
