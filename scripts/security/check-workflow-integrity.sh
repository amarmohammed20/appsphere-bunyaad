#!/bin/sh
# L4 custom fallback. Runs after zizmor + checkov. Catches the five patterns
# neither tool audits: log-leaked credentials, `curl | sh`, env dumps,
# `--no-verify` / `--skip-checks`.
#
# Scan every workflow, but only block on files this PR touched. Pre-existing
# findings become warnings so unrelated PRs are not held.
#
# Inputs: BASE_SHA, HEAD_SHA (optional; without them, everything is a warning).

set -u

# The file holding the layer steps. Named once: it is both the file this scan
# must skip (it spells out the patterns below) and the file whose ShellCheck
# target list is verified at the end.
GATE=".github/workflows/security-gate-reusable.yml"

echo "=== CI/CD PIPELINE INTEGRITY ANALYSIS ==="
FAILED=0

CHANGED_IN_PR=""
if [ -n "${BASE_SHA:-}" ] && [ -n "${HEAD_SHA:-}" ]; then
  CHANGED_IN_PR=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA" -- '.github/' || true)
fi

report() {
  if echo "$CHANGED_IN_PR" | grep -qx "$1"; then
    echo "::error file=$1::$2"
    FAILED=1
  else
    echo "::warning file=$1::[pre-existing, fix in a separate PR] $2"
  fi
}

# Composite actions too: they run inline in the calling job, with the same
# permissions and the same access to secrets, so the patterns below matter
# there just as much.
for file in .github/workflows/*.yml .github/workflows/*.yaml \
  .github/actions/*/action.yml .github/actions/*/action.yaml; do
  [ -f "$file" ] || continue

  # Self-skip: the gate spells out the patterns below, so it matches itself.
  if [ "$file" = "$GATE" ]; then
    echo "Skipping self: $file"
    continue
  fi

  echo "Scanning $file"

  # Strip comments so a documented pattern is not read as a use.
  BODY=$(grep -vE '^[[:space:]]*#' "$file")

  if echo "$BODY" | grep -qE '(echo|printf|cat)[^|]*\$\{\{[[:space:]]*secrets\.'; then
    report "$file" "A secret is written to the workflow log"
  fi
  # Piping into jq, writing to GITHUB_ENV, or registering a mask are
  # legitimate uses of these variables.
  LEAKS=$(echo "$BODY" \
    | grep -E '(echo|printf)[[:space:]]+"[^"]*\$\{?(RESPONSE|ACCESS_TOKEN|REFRESH_TOKEN|TOKEN|SECRET|PASSWORD|CREDENTIAL)' \
    | grep -vE '\||GITHUB_ENV|GITHUB_OUTPUT|add-mask' || true)
  if [ -n "$LEAKS" ]; then
    report "$file" "A credential-bearing variable is written to the workflow log"
    echo "$LEAKS"
  fi
  if echo "$BODY" | grep -qE '(curl|wget)[^|]*\|[[:space:]]*(bash|sh|zsh)'; then
    report "$file" "curl piped directly to a shell"
  fi
  if echo "$BODY" | grep -qE '(printenv|env[[:space:]]*>|set[[:space:]]*>|export[[:space:]]*>)'; then
    report "$file" "Environment dump detected"
  fi
  if echo "$BODY" | grep -qE '(--no-verify|--skip-checks)'; then
    report "$file" "Security bypass flag present (--no-verify / --skip-checks)"
  fi
done

# The gate lists its ShellCheck targets literally, so a script added later is
# linted only if someone remembers to add it. Nothing would report the gap:
# ShellCheck stays silent about files it was never given.
if [ -f "$GATE" ]; then
  for script in scripts/security/*.sh; do
    [ -f "$script" ] || continue
    if ! grep -qF "$script" "$GATE"; then
      echo "::error file=$GATE::$script is not in the L4 ShellCheck target list — add it, or it ships unlinted"
      FAILED=1
    fi
  done
fi

if [ "$FAILED" -eq 1 ]; then
  echo "::error::CI/CD integrity check failed"
  exit 1
fi
echo "CI/CD pipeline integrity check passed"
