import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Set per repo via SUPABASE_PROJECT_REF (.env.local locally, a secret in CI). */
export const defaultProjectRef = '';
export const migrationVersionPattern = /\b\d{14}\b/g;
export const migrationFilenamePattern = /^(\d{14})_.*\.sql$/;

const envFilePath = path.join(process.cwd(), '.env.local');

export const loadEnvFile = (filePath = envFilePath) => {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line
      .slice(0, separatorIndex)
      .trim()
      .replace(/^export\s+/, '');

    if (!key || key in process.env) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

/** Characters that would let an argument break out of a shell command. */
const SHELL_METACHARACTERS = /[&|;$`<>(){}[\]!*?~\n\r"'\\]/;

// shell: true because pnpm is a .cmd shim on Windows; the metacharacter
// guard above keeps that from becoming command injection.
export const runCli = (command, args) => {
  for (const arg of args) {
    if (SHELL_METACHARACTERS.test(String(arg))) {
      throw new Error(
        `Refusing to run ${command}: argument contains shell metacharacters and could alter the command: ${arg}`,
      );
    }
  }

  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const msg = (result.stderr || result.stdout || `exit ${result.status}`).trim();
    const err = new Error(msg);
    err.stderr = result.stderr;
    err.status = result.status;
    throw err;
  }

  return result.stdout ?? '';
};

export const getProjectRef = () => process.env.SUPABASE_PROJECT_REF?.trim() || defaultProjectRef;

export const requireSupabaseAccessToken = (message) => {
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    console.error(`::error::${message}`);
    process.exit(1);
  }
};

export const linkSupabaseProject = ({
  logPrefix = 'Linking to Supabase project',
  requireAccessToken = false,
} = {}) => {
  loadEnvFile();

  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    if (requireAccessToken) {
      console.error('::error::SUPABASE_ACCESS_TOKEN is not configured.');
      process.exit(1);
    }

    return false;
  }

  const projectRef = getProjectRef();
  if (!projectRef) {
    console.error(
      '::error::SUPABASE_PROJECT_REF is not set. Add the hosted project reference ID to .env.local (locally) or the repo secrets (CI).',
    );
    process.exit(1);
  }

  console.warn(`${logPrefix} ${projectRef}...`);
  runCli('pnpm', ['exec', 'supabase', 'link', '--project-ref', projectRef, '--yes']);
  return true;
};

export const listLinkedMigrations = ({ logMessage } = {}) => {
  if (logMessage) {
    console.warn(logMessage);
  }

  return runCli('pnpm', ['exec', 'supabase', 'migration', 'list', '--linked']);
};

export const parseMigrationRows = (output) =>
  output
    .split(/\r?\n/)
    .map((line) => {
      const pipeParts = line.split('|').map((part) => part.trim());

      if (pipeParts.length >= 2) {
        const local = pipeParts[0].match(migrationVersionPattern)?.[0] || '';
        const remote = pipeParts[1].match(migrationVersionPattern)?.[0] || '';

        if (local || remote) {
          return { line, local, remote };
        }
      }

      const versions = line.match(migrationVersionPattern) || [];

      if (versions.length === 1) {
        return { line, local: versions[0], remote: '' };
      }

      if (versions.length >= 2) {
        return { line, local: versions[0], remote: versions[1] };
      }

      return null;
    })
    .filter(Boolean);

export const formatErrorMessage = (error) => {
  if (error && typeof error === 'object' && 'stderr' in error && typeof error.stderr === 'string') {
    return error.stderr.trim();
  }

  return error instanceof Error ? error.message : String(error);
};
