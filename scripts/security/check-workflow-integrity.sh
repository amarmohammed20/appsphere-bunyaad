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

for file in .github/workflows/*.yml .github/workflows/*.yaml; do
  [ -f "$file" ] || continue

  # Self-skip: our rule strings would match this file.
  if [ "$file" = ".github/workflows/security-gate.yml" ]; then
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
    echo "::warning file=$file::Security bypass flag present"
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo "::error::CI/CD integrity check failed"
  exit 1
fi
echo "CI/CD pipeline integrity check passed"
