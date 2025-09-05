import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

// Reutiliza una sola conexión en desarrollo para evitar fugas en HMR
const globalForDb = globalThis as unknown as { _pgPool?: pg.Pool }

if (!globalForDb._pgPool) {
  globalForDb._pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  })
}

export const pool = globalForDb._pgPool
export const db = drizzle(pool)
