import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '../db'

/** Führt beim Start Migrationen aus, wenn RUN_MIGRATIONS=true (Produktion). Lokal wird drizzle-kit push genutzt. */
export default defineNitroPlugin(async () => {
  if (process.env.RUN_MIGRATIONS !== 'true') return
  const folder = process.env.MIGRATIONS_DIR || 'server/db/migrations'
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
    await migrate(db, { migrationsFolder: folder })
    console.log(`[migrate] Datenbank ist aktuell (${folder})`)
  } catch (e) {
    console.error('[migrate] Migration fehlgeschlagen, Server wird beendet:', e)
    process.exit(1)
  }
})
