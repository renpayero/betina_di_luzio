import { readFileSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]!] ??= m[2]!.replace(/^["']|["']$/g, '');
  }
} catch {}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://betina:betina_dev@localhost:5435/betina',
  },
  strict: true,
  verbose: true,
});
