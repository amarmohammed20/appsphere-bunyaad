// A tag is a label, not a version. Whoever owns the action can repoint `v4` at
// new code, and it runs in our pipeline with a token, on the next PR, silently.
// Only a commit SHA names code that cannot change underneath us.
//
// A warning here would be decoration — this exits non-zero.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKFLOWS = '.github/workflows';
const COMMIT_SHA = /^[0-9a-f]{40}$/;

// Workflows in this repo, referenced by path. Nothing to pin — they are the
// same commit as the file doing the referencing.
const isLocal = (ref) => ref.startsWith('./');

// Our own reusable workflows are deliberately referenced by a moving tag, so
// that a fix here reaches every repo without editing each one. That is the
// point of the tag, and the trade-off is documented in
// docs/reusable-workflows.md.
const isOurs = (ref) => ref.startsWith('amarmohammed20/appsphere-bunyaad/');

function unpinnedRefsIn(file) {
  const lines = readFileSync(join(WORKFLOWS, file), 'utf8').split('\n');

  return lines.flatMap((line, index) => {
    if (/^\s*#/.test(line)) return [];

    const ref = line.match(/^\s*-?\s*uses:\s*(\S+)/)?.[1];
    if (!ref || isLocal(ref) || isOurs(ref)) return [];

    const version = ref.split('@')[1];
    return COMMIT_SHA.test(version ?? '') ? [] : [`${file}:${index + 1}  ${ref}`];
  });
}

const workflowFiles = readdirSync(WORKFLOWS).filter((file) => /\.ya?ml$/.test(file));
const unpinned = workflowFiles.flatMap(unpinnedRefsIn);

if (unpinned.length > 0) {
  console.error('These actions are referenced by tag or branch, not by commit:\n');
  for (const ref of unpinned) console.error(`  ${ref}`);
  console.error('\nFind the commit a tag points at:');
  console.error('  gh api repos/<owner>/<repo>/commits/<tag> --jq .sha');
  console.error('\nThen write it as `owner/repo@<sha> # <tag>`.');
  process.exit(1);
}

console.warn(`All actions across ${workflowFiles.length} workflows are pinned to a commit.`);
