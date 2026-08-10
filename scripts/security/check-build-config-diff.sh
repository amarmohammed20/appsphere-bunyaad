#!/bin/sh
# L1 diff analyser. Runs after check-build-config.sh has scanned the tree.
# Reads a PR's changed files and diff, classifies findings by severity, and
# writes /tmp/findings.txt for the PR-comment step. Emits GITHUB_OUTPUT
# variables when $GITHUB_OUTPUT is set (i.e. inside a workflow).
#
# Inputs: BASE_SHA, HEAD_SHA (both required for PR mode).
# Exit code: 1 on critical, 0 otherwise (matches the workflow's contract).

set -u

SEVERITY="info"
FINDINGS=""
CRITICAL_COUNT=0
HIGH_COUNT=0

# Base scan of the tree, done first so a critical from here shows even on push.
if ! sh scripts/security/check-build-config.sh > /tmp/config-integrity.txt 2>&1; then
  FINDINGS="${FINDINGS}$(sed 's/^/  /' /tmp/config-integrity.txt)\n"
  CRITICAL_COUNT=$((CRITICAL_COUNT + 10))
fi
cat /tmp/config-integrity.txt

if [ -n "${BASE_SHA:-}" ] && [ -n "${HEAD_SHA:-}" ]; then
  CHANGED_FILES=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA")

  BUILD_CONFIGS="next.config.ts next.config.js next.config.mjs postcss.config.js postcss.config.mjs postcss.config.cjs tailwind.config.js tailwind.config.ts tailwind.config.mjs eslint.config.mjs eslint.config.js eslint.config.ts eslint.boundaries.mjs babel.config.js .babelrc webpack.config.js instrumentation.ts instrumentation-client.ts sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts"

  # Edit -> HIGH, review only. Injection primitive in the diff -> CRITICAL, block.
  for file in $BUILD_CONFIGS; do
    if echo "$CHANGED_FILES" | grep -q "^${file}$"; then
      HIGH_COUNT=$((HIGH_COUNT + 1))
      FINDINGS="${FINDINGS}HIGH: Build-time config modified: ${file} — requires code-owner review\n"
      DIFF=$(git diff "$BASE_SHA" "$HEAD_SHA" -- "$file")

      if echo "$DIFF" | grep -E '^\+.*(eval\s*\(|new\s+Function|child_process|exec\s*\(|spawn\s*\(|execSync|spawnSync)' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  DANGER: Code execution primitive detected (eval/exec/spawn)\n"
        CRITICAL_COUNT=$((CRITICAL_COUNT + 5))
      fi
      if echo "$DIFF" | grep -E '^\+.*(fetch\s*\(|https?\.|axios|XMLHttpRequest|net\.|dgram\.)' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  DANGER: Network call in build config — possible exfiltration\n"
        CRITICAL_COUNT=$((CRITICAL_COUNT + 5))
      fi
      if echo "$DIFF" | grep -E '^\+.*(Buffer\.|atob|btoa|toString\(.base64|from\(.base64)' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  DANGER: Encoding/decoding detected — possible obfuscated payload\n"
        CRITICAL_COUNT=$((CRITICAL_COUNT + 3))
      fi
      # HIGH, not CRITICAL: legitimate in many configs.
      if echo "$DIFF" | grep -E '^\+.*(fs\.|readFileSync|writeFileSync)' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  WARNING: Filesystem access in build config\n"
        HIGH_COUNT=$((HIGH_COUNT + 1))
      fi
      if echo "$DIFF" | grep -E '^\+.*require\s*\(' | grep -v 'node_modules' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  WARNING: New require() call added\n"
        HIGH_COUNT=$((HIGH_COUNT + 1))
      fi
      if echo "$DIFF" | grep -E '^\+.*import\s*\(' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  WARNING: Dynamic import() added\n"
        HIGH_COUNT=$((HIGH_COUNT + 1))
      fi
      if echo "$DIFF" | grep -E '^\+.*process\.env' | grep -v 'NODE_ENV' >/dev/null 2>&1; then
        FINDINGS="${FINDINGS}  WARNING: Accessing process.env — could exfiltrate secrets\n"
        HIGH_COUNT=$((HIGH_COUNT + 1))
      fi
    fi
  done

  if echo "$CHANGED_FILES" | grep -q "^\.gitignore$"; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: .gitignore modified\n"
    DIFF=$(git diff "$BASE_SHA" "$HEAD_SHA" -- .gitignore)
    if echo "$DIFF" | grep -E '^\+.*(config|\.mjs|\.ts|src/|\.github)' >/dev/null 2>&1; then
      FINDINGS="${FINDINGS}  DANGER: .gitignore now excludes config/source files\n"
      CRITICAL_COUNT=$((CRITICAL_COUNT + 3))
    fi
  fi

  if echo "$CHANGED_FILES" | grep -q "^package\.json$"; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: package.json modified\n"
    DIFF=$(git diff "$BASE_SHA" "$HEAD_SHA" -- package.json)
    if echo "$DIFF" | grep -E '^\+.*"(preinstall|postinstall|preuninstall|prepare|prepublish)"' >/dev/null 2>&1; then
      FINDINGS="${FINDINGS}  DANGER: Lifecycle script added\n"
      CRITICAL_COUNT=$((CRITICAL_COUNT + 3))
    fi
  fi

  WORKFLOW_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^\.github/' || true)
  if [ -n "$WORKFLOW_CHANGES" ]; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: CI/CD workflow files modified — requires review\n"
  fi

  HOOK_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^\.(husky|huskyrc|lintstagedrc)' || true)
  if [ -n "$HOOK_CHANGES" ]; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: Git hooks modified\n"
  fi

  # A weakened detector is often the step before injection.
  SECURITY_SCRIPT_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^scripts/security/' || true)
  if [ -n "$SECURITY_SCRIPT_CHANGES" ]; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: Security check scripts modified — verify detections were not weakened\n"
  fi

  # Supply chain policy lives in pnpm-workspace.yaml (pnpm v11 reads only
  # auth/registry from .npmrc). L3 blocks precise changes; this flags the file.
  if echo "$CHANGED_FILES" | grep -q "^pnpm-workspace\.yaml$"; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: pnpm-workspace.yaml modified — supply chain policy change\n"
    DIFF=$(git diff "$BASE_SHA" "$HEAD_SHA" -- pnpm-workspace.yaml)
    if echo "$DIFF" | grep -E '^\-.*minimumReleaseAge' >/dev/null 2>&1; then
      FINDINGS="${FINDINGS}  DANGER: minimumReleaseAge removed or lowered\n"
      CRITICAL_COUNT=$((CRITICAL_COUNT + 3))
    fi
    if echo "$DIFF" | grep -E '^\+.*dangerouslyAllowAllBuilds' >/dev/null 2>&1; then
      FINDINGS="${FINDINGS}  DANGER: blanket build-script bypass added\n"
      CRITICAL_COUNT=$((CRITICAL_COUNT + 5))
    fi
  fi

  if echo "$CHANGED_FILES" | grep -q "^\.npmrc$"; then
    HIGH_COUNT=$((HIGH_COUNT + 1))
    FINDINGS="${FINDINGS}HIGH: .npmrc modified — supply chain policy change\n"
    DIFF=$(git diff "$BASE_SHA" "$HEAD_SHA" -- .npmrc)
    if echo "$DIFF" | grep -E '^\-.*minimum-release-age' >/dev/null 2>&1; then
      FINDINGS="${FINDINGS}  DANGER: minimum-release-age removed or lowered\n"
      CRITICAL_COUNT=$((CRITICAL_COUNT + 3))
    fi
    if echo "$DIFF" | grep -E '^\+.*(registry[[:space:]]*=|dangerously-allow-all-builds)' >/dev/null 2>&1; then
      FINDINGS="${FINDINGS}  DANGER: registry override or build-script bypass added\n"
      CRITICAL_COUNT=$((CRITICAL_COUNT + 5))
    fi
  fi
fi

if [ "$CRITICAL_COUNT" -gt 0 ]; then
  SEVERITY="critical"
elif [ "$HIGH_COUNT" -gt 0 ]; then
  SEVERITY="high"
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "severity=$SEVERITY"
    echo "critical_count=$CRITICAL_COUNT"
    echo "high_count=$HIGH_COUNT"
  } >> "$GITHUB_OUTPUT"
fi

printf '%b' "$FINDINGS" > /tmp/findings.txt

echo ""
echo "Critical: $CRITICAL_COUNT | High: $HIGH_COUNT | Severity: $SEVERITY"
printf '%b' "$FINDINGS"

if [ "$SEVERITY" = "critical" ]; then
  echo "::error::CRITICAL security findings in build config files."
  exit 1
fi
