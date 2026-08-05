// Classifies local vs remote migration history into one of four states, so
// the workflow can decide what still needs to run. Ported from itc.
//
//   aligned                — nothing to do
//   local_only_tail_valid  — this PR adds new migrations at the end; valid,
//                            but production has not been pushed yet
//   remote_missing_locally — remote has migrations this repo lacks; stop
//   mixed_or_unclassified  — anything else; investigate, do not merge

import { appendFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import {
  formatErrorMessage,
  linkSupabaseProject,
  listLinkedMigrations,
  migrationFilenamePattern,
  parseMigrationRows,
  requireSupabaseAccessToken,
} from './supabase-migrations.mjs';

const outputPath = process.env.GITHUB_OUTPUT;

requireSupabaseAccessToken(
  'SUPABASE_ACCESS_TOKEN is not configured. The migration alignment check cannot run.',
);

const getChangedMigrationVersions = () =>
  (process.env.CHANGED_MIGRATION_FILES || '')
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => file.startsWith('supabase/migrations/') && file.endsWith('.sql'))
    .map((file) => path.basename(file).match(migrationFilenamePattern)?.[1] || null)
    .filter(Boolean);

const getLocalMigrationVersionsFromFiles = () =>
  readdirSync(path.join(process.cwd(), 'supabase', 'migrations'))
    .map((file) => file.match(migrationFilenamePattern)?.[1] || null)
    .filter(Boolean)
    .sort();

const emitOutput = (key, value) => {
  if (!outputPath) {
    return;
  }

  try {
    appendFileSync(outputPath, `${key}=${value}\n`, 'utf8');
  } catch {
    // Best-effort only. The workflow still receives the classified logs.
  }
};

const failWithStatus = (status, message, details = []) => {
  emitOutput('status', status);
  emitOutput('pending_push_required', status === 'local_only_tail_valid' ? 'true' : 'false');
  console.error(`::error::[${status}] ${message}`);
  details.forEach((detail) => console.error(detail));
  process.exit(1);
};

const passWithStatus = (status, message, details = []) => {
  emitOutput('status', status);
  emitOutput('pending_push_required', 'false');
  console.warn(`[${status}] ${message}`);
  details.forEach((detail) => console.warn(detail));
};

try {
  linkSupabaseProject({
    logPrefix: 'Linking CI to Supabase project',
    requireAccessToken: true,
  });

  const output = listLinkedMigrations({
    logMessage: 'Checking local and remote migration history...',
  });
  console.warn(output);

  const rows = parseMigrationRows(output);
  const mismatches = rows.filter(({ local, remote }) => local !== remote);
  const remoteMissingLocally = mismatches.filter(({ local, remote }) => !local && remote);
  const localOnly = mismatches.filter(({ local, remote }) => local && !remote);

  if (remoteMissingLocally.length > 0) {
    failWithStatus(
      'remote_missing_locally',
      'Remote Supabase contains migration versions that are missing locally. Merge or recover the missing migration files before this PR can proceed.',
      remoteMissingLocally.map(({ line }) => line),
    );
  }

  if (mismatches.length === 0) {
    passWithStatus('aligned', 'Supabase migration history is aligned.');
    process.exit(0);
  }

  if (localOnly.length !== mismatches.length) {
    failWithStatus(
      'mixed_or_unclassified',
      'Supabase migration history contains an unexpected mix of mismatches. Investigate with `pnpm db:list` before merging.',
      mismatches.map(({ line }) => line),
    );
  }

  const localVersions = getLocalMigrationVersionsFromFiles();
  const localOnlyVersions = localOnly.map(({ local }) => local).sort();
  const changedMigrationVersions = getChangedMigrationVersions().sort();

  const tailVersions = localVersions.slice(-localOnlyVersions.length);
  const isContiguousLocalTail =
    localOnlyVersions.length > 0 &&
    tailVersions.length === localOnlyVersions.length &&
    tailVersions.every((version, index) => version === localOnlyVersions[index]);

  const changedVersionsMatchTail =
    changedMigrationVersions.length === 0 ||
    (changedMigrationVersions.length === localOnlyVersions.length &&
      changedMigrationVersions.every((version, index) => version === localOnlyVersions[index]));

  if (!isContiguousLocalTail || !changedVersionsMatchTail) {
    const details = [
      ...localOnly.map(({ line }) => line),
      `Local-only versions: ${localOnlyVersions.join(', ')}`,
      `Expected tail versions: ${tailVersions.join(', ') || '(none)'}`,
    ];

    if (changedMigrationVersions.length > 0) {
      details.push(`Changed PR migration versions: ${changedMigrationVersions.join(', ')}`);
    }

    failWithStatus(
      'local_only_not_tail',
      'Local-only migrations must appear as one uninterrupted block at the bottom of `supabase/migrations`. Move the migration so it is the newest file before merging.',
      details,
    );
  }

  failWithStatus(
    'local_only_tail_valid',
    'Migration ordering is correct. The PR adds new local migration files at the end of the list, so engineering work is valid and ready for the manual production step.',
    [
      `Validated local-only tail versions: ${localOnlyVersions.join(', ')}`,
      'Production is still behind this PR.',
      'This workflow remains red until local and remote migration history are fully aligned.',
      'Next manual step: run `pnpm db:push:dry` and then `pnpm db:push`, then rerun this workflow to confirm `pnpm db:list` is aligned.',
    ],
  );
} catch (error) {
  emitOutput('status', 'mixed_or_unclassified');
  emitOutput('pending_push_required', 'false');
  console.error(
    `::error::[mixed_or_unclassified] Supabase migration check failed. ${formatErrorMessage(error)}`,
  );
  process.exit(1);
}
