// Runs after `supabase db reset`; needs Docker and the local stack up.

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

const assertQueryReturns = (label, sql, expected) => {
  const actual = runSql(sql);

  if (actual !== expected) {
    console.error(`::error::${label} Expected ${expected}, received ${actual || '(empty)'}.`);
    process.exit(1);
  }

  console.warn(`${label} OK (${actual})`);
};

console.warn(`Running reset smoke checks against ${dbContainerName}...`);

assertQueryReturns(
  'Seeded account count',
  "select count(*)::text from auth.users where email in ('admin@example.com', 'member@example.com');",
  '2',
);

assertQueryReturns(
  'Signup trigger created both profiles',
  "select count(*)::text from public.profiles where email in ('admin@example.com', 'member@example.com');",
  '2',
);

assertQueryReturns(
  'Seeded admin has the admin role',
  "select role from public.profiles where email = 'admin@example.com';",
  'admin',
);

assertQueryReturns(
  'RLS enabled on profiles',
  "select relrowsecurity::text from pg_class where oid = 'public.profiles'::regclass;",
  'true',
);

assertQueryReturns(
  'profiles policy count',
  "select count(*)::text from pg_policies where schemaname = 'public' and tablename = 'profiles';",
  '4',
);

assertQueryReturns(
  'updated_at trigger present',
  "select count(*)::text from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_set_updated_at';",
  '1',
);

// Policy count proves policies exist, not that they work — so also behave
// like a signed-in member (same claims a browser carries), rolled back after.
const MEMBER_ID = '10000000-0000-4000-8000-000000000002';
const asMember = (sql) =>
  `begin;
   select set_config('request.jwt.claims',
     '{"sub":"${MEMBER_ID}","role":"authenticated"}', true);
   set local role authenticated;
   ${sql}
   rollback;`;

assertQueryReturns(
  'RLS: member sees only their own profile',
  asMember(`select count(*)::text from public.profiles;`),
  '1',
);

assertQueryReturns(
  'RLS: member cannot promote themselves',
  asMember(`with attempt as (
     update public.profiles set role = 'admin'
     where id = '${MEMBER_ID}' returning 1
   ) select count(*)::text from attempt;`),
  '0',
);

const assertQueryRaises = (label, sql, expectedFragment) => {
  try {
    execFileSync('docker', [...sqlCommandPrefix, sql], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';

    if (stderr.includes(expectedFragment)) {
      console.warn(`${label} OK (refused)`);
      return;
    }

    console.error(`::error::${label} failed for the wrong reason: ${stderr.trim()}`);
    process.exit(1);
  }

  console.error(`::error::${label} — the write was allowed but must be refused.`);
  process.exit(1);
};

assertQueryRaises(
  'Trigger: demoting the last admin is refused even for superuser',
  `update public.profiles set role = 'member' where email = 'admin@example.com';`,
  'at least one admin',
);

console.warn('Reset smoke checks passed.');
