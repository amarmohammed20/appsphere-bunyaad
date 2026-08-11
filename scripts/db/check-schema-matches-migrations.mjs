// `supabase/schemas/*.sql` is declared to be the source of truth, but nothing
// made that true: every gate in db-checks keys off changed files under
// supabase/migrations/. Edit a schema file, forget `pnpm db:diff`, and CI
// fast-passes — the change reaches no database, and the next person's diff
// silently carries a stranger's edit into their migration.
//
// This asserts the outcome instead: with the local stack rebuilt from
// migrations, `supabase db diff` must find nothing left to generate.
//
// Needs Docker, the local stack up, and `pnpm db:reset` already run.

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

// The CLI's own JS entry point, run under this Node. Going through `pnpm exec`
// would mean spawning a .cmd shim on Windows, which Node only allows with
// shell: true — and a shell turns every argument into part of a command
// string. Resolving the entry point keeps shell: false on every platform.
const supabaseCli = createRequire(import.meta.url).resolve('supabase/dist/supabase.js');

// Which stream the CLI uses varies by platform, and the JSON summary is not
// guaranteed at all — an earlier version of this script read stdout only and
// failed in CI while passing on Windows. Read both and decide on content.
const runDiff = () => {
  const result = spawnSync(process.execPath, [supabaseCli, 'db', 'diff'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
};

const stripAnsi = (text) => text.replace(/\[[0-9;]*m/g, '');

// The CLI prints progress lines and may print one JSON summary. Take the last
// line that parses, rather than assuming a position or that one exists.
const findDiffSummary = (text) => {
  const candidates = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{') && line.endsWith('}'));

  for (const candidate of candidates.reverse()) {
    try {
      const parsed = JSON.parse(candidate);

      if ('diff' in parsed) {
        return parsed;
      }
    } catch {
      // Not the summary line. Keep looking.
    }
  }

  return null;
};

const reportAndExit = (heading, { stdout, stderr }) => {
  console.error(`::error::${heading}`);
  console.error('--- supabase db diff stdout ---');
  console.error(stdout || '(empty)');
  console.error('--- supabase db diff stderr ---');
  console.error(stderr || '(empty)');
  process.exit(1);
};

let diffRun;

try {
  diffRun = runDiff();
} catch (error) {
  console.error(`::error::Could not run \`supabase db diff\`. ${error.message}`);
  process.exit(1);
}

const combined = stripAnsi(`${diffRun.stdout}\n${diffRun.stderr}`);

if (diffRun.status !== 0) {
  reportAndExit(`\`supabase db diff\` exited ${diffRun.status}.`, diffRun);
}

// The plain-text signal is the stable one across versions and platforms.
if (combined.includes('No schema changes found')) {
  console.warn('Schema files and migrations agree — nothing left to generate.');
  process.exit(0);
}

const summary = findDiffSummary(combined);

if (summary === null) {
  reportAndExit(
    'Could not tell whether the schemas match: no "No schema changes found" line and no JSON summary.',
    diffRun,
  );
}

const drift = (summary.diff ?? '').trim();

if (drift === '') {
  console.warn('Schema files and migrations agree — nothing left to generate.');
  process.exit(0);
}

console.error('::error::supabase/schemas/ and supabase/migrations/ have diverged.');
console.error('::error::A schema file was edited without running `pnpm db:diff <name>`.');
console.error('::error::The statements below exist in the schema files and in no migration:');
console.error(drift);
process.exit(1);
