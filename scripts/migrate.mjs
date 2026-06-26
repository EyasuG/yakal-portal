// Applies the Yakal database schema (and optionally the seed) to a Postgres
// database — e.g. a Supabase project — over a single connection.
//
//   DATABASE_URL="postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres" \
//     node scripts/migrate.mjs            # schema only
//   ... node scripts/migrate.mjs --seed   # schema + seed
//
// The connection string is read from the environment and is NEVER written to
// the repo. Do not commit a real DATABASE_URL.
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const db = path.join(here, '..', 'db');

const url = process.env.DATABASE_URL;
if (!url) { console.error('Set DATABASE_URL (the Supabase connection string).'); process.exit(1); }

const files = ['schema.sql', ...(process.argv.includes('--seed') ? ['seed.sql'] : [])];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('Connected.');
  for (const f of files) {
    const sql = fs.readFileSync(path.join(db, f), 'utf8');
    process.stdout.write(`Applying ${f} … `);
    await client.query(sql);
    console.log('ok');
  }
  // Quick sanity read-back.
  const { rows } = await client.query(
    "select count(*)::int as tables from information_schema.tables where table_schema='public'"
  );
  console.log(`public tables now: ${rows[0].tables}`);
} catch (e) {
  console.error('\nMigration failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
