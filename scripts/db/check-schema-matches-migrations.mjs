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

import { formatErrorMessage, runCli } from './supabase-migrations.mjs';

const parseDiffResult = (output) => {
  // The CLI prints progress lines and then one JSON summary. Parse the last
  // line that looks like JSON rather than assuming a line count.
  const jsonLine = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{') && line.endsWith('}'))
    .at(-1);

  if (jsonLine === undefined) {
    return null;
  }

  try {
    return JSON.parse(jsonLine);
  } catch {
    return null;
  }
};

let output;

try {
  output = runCli('pnpm', ['exec', 'supabase', 'db', 'diff']);
} catch (error) {
  console.error(
    `::error::Could not diff schemas against the local database. ${formatErrorMessage(error)}`,
  );
  process.exit(1);
}

const result = parseDiffResult(output);

if (result === null) {
  console.error('::error::Could not parse the output of `supabase db diff`. Raw output follows.');
  console.error(output);
  process.exit(1);
}

const drift = (result.diff ?? '').trim();

if (drift !== '') {
  console.error('::error::supabase/schemas/ and supabase/migrations/ have diverged.');
  console.error('::error::A schema file was edited without running `pnpm db:diff <name>`.');
  console.error('::error::The statements below exist in the schema files and in no migration:');
  console.error(drift);
  process.exit(1);
}

console.warn('Schema files and migrations agree — nothing left to generate.');
