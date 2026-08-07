// A boundaries config whose patterns stop matching passes lint while
// enforcing nothing — happened twice, so green lint is not evidence. Each
// case asserts the exact rule; files go to disk for import/no-cycle.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ESLint } from 'eslint';

const CASES = [
  {
    name: 'component imports a query',
    rule: 'boundaries/dependencies',
    path: 'src/features/users/components/__canary.tsx',
    code: `import { listUsers } from '../server/queries';\nexport const a = listUsers;\n`,
  },
  {
    name: 'feature imports another feature',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/components/__canary.tsx',
    code: `import { usersLabels } from '@/features/users/data/labels';\nexport const b = usersLabels;\n`,
  },
  {
    name: 'component imports the Supabase wrapper',
    rule: 'boundaries/dependencies',
    path: 'src/features/users/components/__canary2.tsx',
    code: `import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';\nexport const c = createSupabaseClient;\n`,
  },
  {
    name: 'component imports the Supabase SDK directly',
    rule: 'boundaries/dependencies',
    path: 'src/features/users/components/__canary3.tsx',
    code: `import { createSupabaseClient } from '@supabase/supabase-js';\nexport const d = createSupabaseClient;\n`,
  },
  {
    name: 'data imports something with behaviour',
    rule: 'boundaries/dependencies',
    path: 'src/features/users/data/__canary.ts',
    code: `import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';\nexport const e = createSupabaseClient;\n`,
  },
  {
    name: 'HTTP handler imports Supabase instead of delegating',
    rule: 'boundaries/dependencies',
    path: 'src/features/auth/api/__canary.ts',
    code: `import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';\nexport const f = createSupabaseClient;\n`,
  },
  {
    name: 'lib launders Supabase to components',
    rule: 'boundaries/dependencies',
    path: 'src/lib/__canary.ts',
    code: `import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';\nexport const g = createSupabaseClient;\n`,
  },
  {
    name: 'component imports the session helpers',
    rule: 'boundaries/dependencies',
    path: 'src/features/users/components/__canary4.tsx',
    code: `import { requireUser } from '@/lib/auth/session';\nexport const j = requireUser;\n`,
  },
  {
    name: 'lib launders the session helpers to components',
    rule: 'boundaries/dependencies',
    path: 'src/lib/__canary2.ts',
    code: `import { requireUser } from '@/lib/auth/session';\nexport const k = requireUser;\n`,
  },
  {
    name: 'invented folder inside a feature falls to the catch-all',
    rule: 'boundaries/dependencies',
    path: 'src/features/users/__canaryhelpers/__canary.ts',
    code: `import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';\nexport const h = createSupabaseClient;\n`,
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
const KNOWN_GOOD = 'src/features/users/components/UsersTable.tsx';

function writeCases() {
  for (const { path, code } of CASES) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, code);
  }
}

function removeCases() {
  for (const { path } of CASES) rmSync(path, { force: true });
  rmSync('src/features/__canary', { recursive: true, force: true });
  rmSync('src/features/users/__canaryhelpers', { recursive: true, force: true });
  rmSync('src/__canaryjobs', { recursive: true, force: true });
}

let results;

try {
  writeCases();
  results = await new ESLint().lintFiles([...CASES.map(({ path }) => path), KNOWN_GOOD]);
} finally {
  removeCases();
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

const falsePositives = (rulesByPath.get(resolve(KNOWN_GOOD)) ?? []).filter((rule) =>
  rule.startsWith('boundaries/'),
);

if (falsePositives.length > 0) {
  failures.push(`${KNOWN_GOOD} is legal but was rejected by ${falsePositives.join(', ')}`);
}

if (failures.length > 0) {
  console.error('Boundary rules are not behaving correctly:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  console.error('\nThe config may pass lint while doing nothing. Check that element');
  console.error('patterns still match the folders they name.');
  process.exit(1);
}

console.warn(`All ${CASES.length} boundary rules fire, and legal imports still pass.`);
