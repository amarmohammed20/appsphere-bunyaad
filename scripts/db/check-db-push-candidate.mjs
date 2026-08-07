// The migrations about to be pushed must be exactly the ones this PR
// changed, sitting as the contiguous tail of the history.

import { readdirSync } from 'node:fs';
import path from 'node:path';

import {
  formatErrorMessage,
  linkSupabaseProject,
  listLinkedMigrations,
  migrationFilenamePattern,
  parseMigrationRows,
  requireSupabaseAccessToken,
} from './supabase-migrations.mjs';

requireSupabaseAccessToken(
  'SUPABASE_ACCESS_TOKEN is not configured. The dry-push candidate check cannot run.',
);

const getChangedMigrationVersions = () =>
  (process.env.CHANGED_MIGRATION_FILES || '')
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => file.startsWith('supabase/migrations/') && file.endsWith('.sql'))
    .map((file) => path.basename(file).match(migrationFilenamePattern)?.[1] || null)
    .filter(Boolean)
    .sort();

const getLocalMigrationVersionsFromFiles = () =>
  readdirSync(path.join(process.cwd(), 'supabase', 'migrations'))
    .map((file) => file.match(migrationFilenamePattern)?.[1] || null)
    .filter(Boolean)
    .sort();

const fail = (message, details = []) => {
  console.error(`::error::${message}`);
  details.forEach((detail) => console.error(detail));
  process.exit(1);
};

try {
  linkSupabaseProject({
    logPrefix: 'Linking CI to Supabase project',
    requireAccessToken: true,
  });

  const output = listLinkedMigrations({
    logMessage: 'Re-checking local and remote migration history before dry-push...',
  });
  console.warn(output);

  const rows = parseMigrationRows(output);
  const localOnlyVersions = rows
    .filter(({ local, remote }) => local && !remote)
    .map(({ local }) => local)
    .sort();
  const remoteOnlyVersions = rows
    .filter(({ local, remote }) => !local && remote)
    .map(({ remote }) => remote)
    .sort();
  const changedMigrationVersions = getChangedMigrationVersions();
  const localVersions = getLocalMigrationVersionsFromFiles();
  const expectedTailVersions = localVersions.slice(-localOnlyVersions.length);

  if (remoteOnlyVersions.length > 0) {
    fail(
      'Remote migrations are missing locally. The dry-push candidate is unsafe until local and remote are aligned.',
      remoteOnlyVersions.map((version) => `Remote-only migration: ${version}`),
    );
  }

  if (localOnlyVersions.length === 0) {
    fail(
      'No local-only migrations remain to dry-push. Dry-push should run only when this PR still has pending local migrations not yet present in remote.',
    );
  }

  if (
    expectedTailVersions.length !== localOnlyVersions.length ||
    expectedTailVersions.some((version, index) => version !== localOnlyVersions[index])
  ) {
    fail(
      'The pending local-only migrations are not the final contiguous tail in `supabase/migrations`.',
      [
        `Pending local-only versions: ${localOnlyVersions.join(', ')}`,
        `Expected tail versions: ${expectedTailVersions.join(', ') || '(none)'}`,
      ],
    );
  }

  if (
    changedMigrationVersions.length !== localOnlyVersions.length ||
    changedMigrationVersions.some((version, index) => version !== localOnlyVersions[index])
  ) {
    fail(
      'The migration files changed in this PR do not exactly match the migrations that would be dry-pushed.',
      [
        `Changed PR migration versions: ${changedMigrationVersions.join(', ') || '(none)'}`,
        `Pending local-only versions: ${localOnlyVersions.join(', ')}`,
      ],
    );
  }

  console.warn(
    `Dry-push candidate validated. Pending local-only tail versions: ${localOnlyVersions.join(', ')}`,
  );
} catch (error) {
  console.error(`::error::Dry-push candidate validation failed. ${formatErrorMessage(error)}`);
  process.exit(1);
}
