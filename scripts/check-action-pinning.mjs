// A tag can be repointed at new code that then runs in our pipeline with a
// token; only a commit SHA cannot change underneath us.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const COMMIT_SHA = /^[0-9a-f]{40}$/;
const IMAGE_DIGEST = /^sha256:[0-9a-f]{64}$/;

// Workflows in this repo, referenced by path. Nothing to pin — they are the
// same commit as the file doing the referencing.
const isLocal = (ref) => ref.startsWith('./');

// Our own reusable workflows are deliberately referenced by a moving tag, so
// a fix reaches every repo without editing each one. Only the exact refs we
// publish are exempt — `@main` or a branch would defeat the entire check.
const OUR_REFS = [
  'amarmohammed20/appsphere-bunyaad/.github/workflows/pr-checks-reusable.yml@v1',
  'amarmohammed20/appsphere-bunyaad/.github/workflows/db-checks-reusable.yml@v1',
  'amarmohammed20/appsphere-bunyaad/.github/workflows/security-gate-reusable.yml@v1',
];

function unpinnedRefsIn(path) {
  const lines = readFileSync(path, 'utf8').split('\n');

  return lines.flatMap((line, index) => {
    if (/^\s*#/.test(line)) return [];

    // Strip the quotes YAML allows around a value, so a quoted ref is read as
    // the ref rather than failing on a trailing quote.
    const ref = line.match(/^\s*-?\s*uses:\s*['"]?([^'"\s#]+)/)?.[1];
    if (!ref || isLocal(ref) || OUR_REFS.includes(ref)) return [];

    // A container image is pinned by digest, which is not a git SHA.
    const version = ref.split('@')[1] ?? '';
    const pinned = ref.startsWith('docker://')
      ? IMAGE_DIGEST.test(version)
      : COMMIT_SHA.test(version);

    return pinned ? [] : [`${path}:${index + 1}  ${ref}`];
  });
}

// Composite actions carry `uses:` too. Leaving them unscanned means unpinned
// refs re-enter the moment someone factors steps out of a workflow.
function filesToScan() {
  const workflows = existsSync('.github/workflows')
    ? readdirSync('.github/workflows')
        .filter((name) => /\.ya?ml$/.test(name))
        .map((name) => join('.github/workflows', name))
    : [];

  const actions = existsSync('.github/actions')
    ? readdirSync('.github/actions')
        .map((name) => join('.github/actions', name))
        .filter((path) => statSync(path).isDirectory())
        .flatMap((dir) => ['action.yml', 'action.yaml'].map((name) => join(dir, name)))
        .filter(existsSync)
    : [];

  return [...workflows, ...actions];
}

const workflowFiles = filesToScan();
const unpinned = workflowFiles.flatMap(unpinnedRefsIn);

if (unpinned.length > 0) {
  console.error('These actions are referenced by tag or branch, not by commit:\n');
  for (const ref of unpinned) console.error(`  ${ref}`);
  console.error('\nFind the commit a tag points at:');
  console.error('  gh api repos/<owner>/<repo>/commits/<tag> --jq .sha');
  console.error('\nThen write it as `owner/repo@<sha> # <tag>`.');
  process.exit(1);
}

console.warn(`All actions across ${workflowFiles.length} workflow files are pinned to a commit.`);
