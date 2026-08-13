// A boundaries config whose patterns stop matching passes lint while
// enforcing nothing — happened twice, so green lint is not evidence. Each
// case asserts the exact rule; files go to disk for import/no-cycle.

import { mkdirSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ESLint } from 'eslint';

// Import targets, written but not linted. Keeping them synthetic means the
// canary does not break when a real feature is added or removed.
const FIXTURES = [
  { path: 'src/features/__canary/server/__fixture.ts', code: `export const load = () => null;\n` },
  { path: 'src/features/__canary/data/__fixture.ts', code: `export const labels = {};\n` },
  { path: 'src/lib/auth/__fixture.ts', code: `export const requireUser = () => null;\n` },
];

const SUPABASE_IMPORT = `import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';\n`;

const CASES = [
  {
    name: 'component imports a query',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/components/__canary.tsx',
    code: `import { load } from '../server/__fixture';\nexport const a = load;\n`,
  },
  {
    name: 'feature imports another feature',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canaryother/components/__canary.tsx',
    code: `import { labels } from '@/features/__canary/data/__fixture';\nexport const b = labels;\n`,
  },
  {
    name: 'component imports the Supabase wrapper',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/components/__canary2.tsx',
    code: `${SUPABASE_IMPORT}export const c = createSupabaseClient;\n`,
  },
  {
    name: 'component imports the Supabase SDK directly',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/components/__canary3.tsx',
    code: `import { createSupabaseClient } from '@supabase/supabase-js';\nexport const d = createSupabaseClient;\n`,
  },
  {
    name: 'data imports something with behaviour',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/data/__canary.ts',
    code: `${SUPABASE_IMPORT}export const e = createSupabaseClient;\n`,
  },
  {
    name: 'HTTP handler imports Supabase instead of delegating',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/api/__canary.ts',
    code: `${SUPABASE_IMPORT}export const f = createSupabaseClient;\n`,
  },
  {
    name: 'lib launders Supabase to components',
    rule: 'boundaries/dependencies',
    path: 'src/lib/__canary.ts',
    code: `${SUPABASE_IMPORT}export const g = createSupabaseClient;\n`,
  },
  {
    name: 'component imports the session helpers',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/components/__canary4.tsx',
    code: `import { requireUser } from '@/lib/auth/__fixture';\nexport const j = requireUser;\n`,
  },
  {
    name: 'lib launders the session helpers to components',
    rule: 'boundaries/dependencies',
    path: 'src/lib/__canary2.ts',
    code: `import { requireUser } from '@/lib/auth/__fixture';\nexport const k = requireUser;\n`,
  },
  {
    name: 'invented folder inside a feature falls to the catch-all',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/__canaryhelpers/__canary.ts',
    code: `${SUPABASE_IMPORT}export const h = createSupabaseClient;\n`,
  },
  {
    name: 'unclassified folder is rejected',
    rule: 'boundaries/no-unknown-files',
    path: 'src/__canaryjobs/__canary.ts',
    code: `export const i = 1;\n`,
  },
];

// The cases above prove bad imports fail. This proves good ones still pass —
// a broken `captured` template would deny every same-feature import and the
// checks above would stay green.
const KNOWN_GOOD = {
  path: 'src/features/__canary/components/__canarygood.tsx',
  code: `import { labels } from '../data/__fixture';\nexport const good = labels;\n`,
};

const WRITTEN = [...FIXTURES, ...CASES, KNOWN_GOOD];

function writeFiles() {
  for (const { path, code } of WRITTEN) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, code);
  }
}

function removeFiles() {
  for (const { path } of WRITTEN) rmSync(path, { force: true });

  rmSync('src/features/__canary', { recursive: true, force: true });
  rmSync('src/features/__canaryother', { recursive: true, force: true });
  rmSync('src/__canaryjobs', { recursive: true, force: true });

  // Only the fixture is ours. Here src/lib/auth holds the real session
  // helpers so this no-ops, but in a clone that removed them it must not
  // leave an empty directory behind.
  try {
    rmdirSync('src/lib/auth');
  } catch {
    // Not empty, or already gone.
  }
}

let results;

try {
  writeFiles();
  results = await new ESLint().lintFiles([...CASES.map(({ path }) => path), KNOWN_GOOD.path]);
} finally {
  removeFiles();
}

const rulesByPath = new Map(
  results.map((result) => [result.filePath, result.messages.map((m) => m.ruleId).filter(Boolean)]),
);

const failures = CASES.map(({ name, rule, path }) => {
  const fired = rulesByPath.get(resolve(path)) ?? [];
  return fired.includes(rule)
    ? null
    : `${name} — expected ${rule}, got ${fired.join(', ') || 'nothing'}`;
}).filter(Boolean);

const falsePositives = (rulesByPath.get(resolve(KNOWN_GOOD.path)) ?? []).filter((rule) =>
  rule.startsWith('boundaries/'),
);

if (falsePositives.length > 0) {
  failures.push(`${KNOWN_GOOD.path} is legal but was rejected by ${falsePositives.join(', ')}`);
}

if (failures.length > 0) {
  console.error('Boundary rules are not behaving correctly:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  console.error('\nThe config may pass lint while doing nothing. Check that element');
  console.error('patterns still match the folders they name.');
  process.exit(1);
}

console.warn(`All ${CASES.length} boundary rules fire, and legal imports still pass.`);
