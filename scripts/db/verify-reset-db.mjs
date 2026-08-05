// Smoke checks after `supabase db reset`: the rebuilt database must contain
// what migrations plus seed promise. Runs psql inside the local container, so
// it needs Docker and a running stack.

import { execFileSync } from 'node:child_process';

const dbContainerName = process.env.SUPABASE_DB_CONTAINER || 'supabase_db_bunyaad';
const sqlCommandPrefix = [
  'exec',
  dbContainerName,
  'psql',
  '-U',
  'postgres',
  '-d',
  'postgres',
  '-tA',
  '-c',
];

const runSql = (sql) => {
  try {
    return execFileSync('docker', [...sqlCommandPrefix, sql], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    let message = error instanceof Error ? error.message : String(error);

    if (
      error &&
      typeof error === 'object' &&
      'stderr' in error &&
      typeof error.stderr === 'string'
    ) {
      message = error.stderr.trim();
    }

    console.error(
      `::error::Smoke check query failed while using container \`${dbContainerName}\`. ${message}`,
    );
    process.exit(1);
  }
};

const assertEquals = (label, sql, expected) => {
  const actual = runSql(sql);

  if (actual !== expected) {
    console.error(`::error::${label} Expected ${expected}, received ${actual || '(empty)'}.`);
    process.exit(1);
  }

  console.warn(`${label} OK (${actual})`);
};

console.warn(`Running reset smoke checks against ${dbContainerName}...`);

assertEquals(
  'Seeded account count',
  "select count(*)::text from auth.users where email in ('admin@example.com', 'member@example.com');",
  '2',
);

assertEquals(
  'Signup trigger created both profiles',
  "select count(*)::text from public.profiles where email in ('admin@example.com', 'member@example.com');",
  '2',
);

assertEquals(
  'Seeded admin has the admin role',
  "select role from public.profiles where email = 'admin@example.com';",
  'admin',
);

assertEquals(
  'RLS enabled on profiles',
  "select relrowsecurity::text from pg_class where oid = 'public.profiles'::regclass;",
  'true',
);

assertEquals(
  'profiles policy count',
  "select count(*)::text from pg_policies where schemaname = 'public' and tablename = 'profiles';",
  '4',
);

assertEquals(
  'updated_at trigger present',
  "select count(*)::text from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_set_updated_at';",
  '1',
);

console.warn('Reset smoke checks passed.');
