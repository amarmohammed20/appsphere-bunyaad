// A table created without row level security is readable by anyone holding
// the anon key, which ships in the browser bundle — public by definition.
// This scans every migration and fails if a table in the public schema is
// created without RLS being enabled anywhere in the migration history.
//
// Runs before install in CI: it needs nothing but the filesystem.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const CREATE_TABLE = /create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)/gi;
const ENABLE_RLS = /alter\s+table\s+(?:only\s+)?([^\s]+)\s+enable\s+row\s+level\s+security/gi;

// `"public"."users"` and `public.users` both become `public.users`.
function normaliseTableName(raw) {
  const parts = raw.replaceAll('"', '').split('.');
  const table = parts.at(-1);
  const schema = parts.length > 1 ? parts.at(-2) : 'public';

  return `${schema}.${table}`;
}

function collectMatches(sql, pattern) {
  return [...sql.matchAll(pattern)].map(([, name]) => normaliseTableName(name));
}

const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const createdIn = new Map();
const rlsEnabled = new Set();

for (const file of migrationFiles) {
  const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

  for (const table of collectMatches(sql, CREATE_TABLE)) {
    if (table.startsWith('public.') && !createdIn.has(table)) {
      createdIn.set(table, file);
    }
  }

  for (const table of collectMatches(sql, ENABLE_RLS)) {
    rlsEnabled.add(table);
  }
}

const unprotected = [...createdIn].filter(([table]) => !rlsEnabled.has(table));

if (unprotected.length > 0) {
  console.error('::error::Tables created without row level security:\n');

  for (const [table, file] of unprotected) {
    console.error(`  ${table}  (created in ${file})`);
  }

  console.error('\nEvery table in the public schema is reachable with the anon');
  console.error('key unless RLS is enabled. Add to the declarative schema:');
  console.error('\n  alter table <name> enable row level security;\n');
  console.error('then regenerate the migration with `pnpm db:diff <name>`.');
  process.exit(1);
}

console.warn(
  `All ${createdIn.size} public tables across ${migrationFiles.length} migrations have row level security enabled.`,
);
