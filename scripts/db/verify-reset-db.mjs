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

const asSignedInUser = (userId, sql) =>
  `begin;
   select set_config('request.jwt.claims',
     '{"sub":"${userId}","role":"authenticated"}', true);
   set local role authenticated;
   ${sql}
   rollback;`;

// psql prints one result per statement, so the block above returns
// BEGIN / the set_config value / SET / our value / ROLLBACK. Comparing the
// whole blob never matches — assert on the line immediately before ROLLBACK.
const assertSignedInQueryReturns = (label, userId, sql, expected) => {
  const lines = runSql(asSignedInUser(userId, sql))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rollbackIndex = lines.lastIndexOf('ROLLBACK');
  const actual = rollbackIndex > 0 ? lines[rollbackIndex - 1] : '';

  if (actual !== expected) {
    console.error(
      `::error::${label} Expected ${expected}, received ${actual || '(empty)'}. Full output: ${lines.join(' | ')}`,
    );
    process.exit(1);
  }

  console.warn(`${label} OK (${actual})`);
};

assertSignedInQueryReturns(
  'RLS: member sees only their own profile',
  MEMBER_ID,
  `select count(*)::text from public.profiles;`,
  '1',
);

assertSignedInQueryReturns(
  'RLS: member cannot promote themselves',
  MEMBER_ID,
  `with attempt as (
     update public.profiles set role = 'admin'
     where id = '${MEMBER_ID}' returning 1
   ) select count(*)::text from attempt;`,
  '0',
);

// The admin path is the one that broke when is_admin() was revoked rather than
// hidden: policies are evaluated with the caller's privileges, so an admin who
// cannot execute the helper silently sees nothing. Only asserting the member
// path missed it entirely.
const ADMIN_ID = '10000000-0000-4000-8000-000000000001';

assertSignedInQueryReturns(
  'RLS: admin sees every profile',
  ADMIN_ID,
  `select count(*)::text from public.profiles;`,
  '2',
);

// Hidden by schema visibility, not by revoking execute — `private` is absent
// from `[api] schemas`, so PostgREST never exposes it.
assertQueryReturns(
  'is_admin is not in the API-exposed public schema',
  `select count(*)::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin';`,
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
