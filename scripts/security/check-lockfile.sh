#!/bin/sh
# L3 lockfile + registry integrity. Runs BEFORE `pnpm install` so a poisoned
# .npmrc registry cannot be trusted during install.
#
# Inputs: BASE_SHA, HEAD_SHA (optional, used only for the drift warning).

set -u

echo "=== LOCKFILE INTEGRITY CHECK ==="

echo "Checking lockfile sync..."
pnpm install --frozen-lockfile --lockfile-only 2>&1 || {
  echo "::error::pnpm-lock.yaml is out of sync with package.json"
  echo "::error::Run 'pnpm install' and commit the updated lockfile"
  exit 1
}

# pnpm-lock.yaml stores integrity hashes but no registry URL, so a
# substituted registry is only visible in .npmrc.
ROGUE_REGISTRY=$(grep -nE '^\s*(registry|@[^:]+:registry)\s*=' .npmrc 2>/dev/null \
  | grep -vE 'registry\.npmjs\.org' || true)
if [ -n "$ROGUE_REGISTRY" ]; then
  echo "::error::.npmrc points package resolution at a non-npm registry:"
  echo "$ROGUE_REGISTRY"
  echo "::error::Every dependency would then be fetched from that host. Verify this is intended."
  exit 1
fi

# git and direct-tarball dependencies bypass the registry.
ROGUE_TARBALL=$(grep -oE 'tarball: https?://[^,}[:space:]]+' pnpm-lock.yaml 2>/dev/null \
  | grep -vE 'registry\.npmjs\.org|codeload\.github\.com|github\.com' | head -5 || true)
if [ -n "$ROGUE_TARBALL" ]; then
  echo "::error::Lockfile fetches packages directly from a non-npm host:"
  echo "$ROGUE_TARBALL"
  echo "::error::This is how a substituted package enters the build. Verify every entry above."
  exit 1
fi
echo "Registry configuration and all lockfile entries resolve to the public npm registry"

if [ -n "${BASE_SHA:-}" ] && [ -n "${HEAD_SHA:-}" ]; then
  if git diff --name-only "$BASE_SHA" "$HEAD_SHA" | grep -q "^pnpm-lock.yaml$"; then
    if ! git diff --name-only "$BASE_SHA" "$HEAD_SHA" | grep -q "^package.json$"; then
      echo "::warning::pnpm-lock.yaml changed without package.json change"
    fi
  fi
fi

echo "Lockfile integrity check passed"
