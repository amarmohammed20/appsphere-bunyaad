// A boundaries config can pass lint while enforcing nothing — a pattern that
// stops matching leaves files unclassified and every policy silently succeeds.
// That happened twice during setup, so green lint is not evidence.
//
// Asserting the exact rule matters: a dead policy can still trip
// no-unknown-files, which looks like success. Files are written to disk
// because import/no-cycle resolves the real dependency graph.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ESLint } from 'eslint';

const CASES = [
  {
    name: 'component imports a query',
    rule: 'boundaries/dependencies',
    path: 'src/features/contact/components/__canary.tsx',
    code: `import { listEnquiries } from '../server/queries';\nexport const a = listEnquiries;\n`,
  },
  {
    name: 'feature imports another feature',
    rule: 'boundaries/dependencies',
    path: 'src/features/__canary/components/__canary.tsx',
    code: `import { contactLabels } from '@/features/contact/data/labels';\nexport const b = contactLabels;\n`,
  },
  {
    name: 'component imports the Supabase wrapper',
    rule: 'boundaries/dependencies',
    path: 'src/features/contact/components/__canary2.tsx',
    code: `import { createClient } from '@/lib/supabase/server';\nexport const c = createClient;\n`,
  },
  {
    name: 'component imports the Supabase SDK directly',
    rule: 'boundaries/dependencies',
    path: 'src/features/contact/components/__canary3.tsx',
    code: `import { createClient } from '@supabase/supabase-js';\nexport const d = createClient;\n`,
  },
  {
    name: 'data imports something with behaviour',
    rule: 'boundaries/dependencies',
    path: 'src/features/contact/data/__canary.ts',
    code: `import { createClient } from '@/lib/supabase/server';\nexport const e = createClient;\n`,
  },
  {
    name: 'HTTP handler imports Supabase instead of delegating',
    rule: 'boundaries/dependencies',
    path: 'src/features/contact/api/__canary.ts',
    code: `import { createClient } from '@/lib/supabase/server';\nexport const f = createClient;\n`,
  },
  {
    name: 'unclassified folder is rejected',
    rule: 'boundaries/no-unknown-files',
    path: 'src/__canaryjobs/__canary.ts',
    code: `export const g = 1;\n`,
  },
];

function writeCases() {
  for (const { path, code } of CASES) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, code);
  }
}

function removeCases() {
  for (const { path } of CASES) rmSync(path, { force: true });
  rmSync('src/features/__canary', { recursive: true, force: true });
  rmSync('src/__canaryjobs', { recursive: true, force: true });
}

let results;

try {
  writeCases();
  results = await new ESLint().lintFiles(CASES.map((testCase) => testCase.path));
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

if (failures.length > 0) {
  console.error('Boundary rules are not being enforced:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  console.error('\nThe config may pass lint while doing nothing. Check that element');
  console.error('patterns still match the folders they name.');
  process.exit(1);
}

console.warn(`All ${CASES.length} boundary rules fire correctly.`);
