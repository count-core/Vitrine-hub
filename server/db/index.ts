import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as tables from './schema'
import * as rel from './relations'
const schema = { ...tables, ...rel }

const url = process.env.DATABASE_URL || 'postgres://stamp:stamp@127.0.0.1:5432/stamp_hub'
const client = postgres(url, { max: 10 })

export const db = drizzle(client, { schema })
export type Db = typeof db
export { schema }
