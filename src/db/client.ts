import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://betina:betina_dev@localhost:5435/betina';

const globalForDb = globalThis as unknown as {
  __betinaPool?: pg.Pool;
};

export const pool =
  globalForDb.__betinaPool ??
  new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (!globalForDb.__betinaPool) {
  globalForDb.__betinaPool = pool;
}

export const db = drizzle(pool, { schema });
export type DB = typeof db;
