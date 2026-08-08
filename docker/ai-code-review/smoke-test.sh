#!/usr/bin/env bash
# Proves a built image can actually do its job. Lives inside the image on
# purpose: the release workflow that runs it stays generic, and anyone can
# verify a pulled image without a workflow at all —
#
#   docker run --rm ghcr.io/<owner>/<repo>/ai-code-review:v1 /smoke-test.sh
#
# A build only proves the downloads resolved. These are the ways this image has
# actually broken: a CLI that will not execute, a script that will not import, a
# prompt asset that is missing so the first real review dies several minutes in,
# and — the quiet one — a CLI reading a default config instead of ours.
set -euo pipefail

fail=0

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    printf '  ok    %s\n' "$label"
  else
    printf '  FAIL  %s\n' "$label"
    fail=1
  fi
}

# --- configs first ------------------------------------------------------------
#
# Before any CLI runs, because `cursor-agent --version` *creates* a default
# config at $HOME/.cursor/cli-config.json when none is there. Checking after it
# ran would find a file every time and prove nothing.
#
# And by content, not existence, because that generated default is the exact
# failure being guarded against: it is permissive where ours is an allowlist, so
# a wrong $HOME does not error — it silently drops the sandbox. Nothing in the
# job log would say so.
#
# Note what this can and cannot promise. It checks the config is correct for the
# HOME this test runs under. Cursor exposes no config-dir variable, so it always
# reads $HOME — meaning a container job, which does not run with HOME=/root, has
# to set it. That guarantee lives in ai-code-review-reusable.yml, not here.
echo "CLI configs are ours, not a generated default:"

cursor_config="${HOME:-/nonexistent}/.cursor/cli-config.json"
check "cursor  present at \$HOME/.cursor/cli-config.json" test -f "$cursor_config"
# 186 rules when this was written. The threshold only has to separate ours from
# the ~1-rule default, so it does not need updating when a rule is added.
# $1 is expanded by the inner bash, not this one; the path is passed as a
# positional so a path containing a space cannot re-split.
# shellcheck disable=SC2016
check "cursor  is the allowlist config, not the default" \
  bash -c 'grep -q "\"approvalMode\": \"allowlist\"" "$1" &&
           grep -q "Shell(sudo \*)" "$1" &&
           [ "$(grep -c "Shell(" "$1")" -gt 100 ]' _ "$cursor_config"

codex_config="${CODEX_HOME:-/nonexistent}/config.toml"
check "codex   present at \$CODEX_HOME/config.toml" test -f "$codex_config"
# As above: $1 belongs to the inner bash.
# shellcheck disable=SC2016
check "codex   has the sandbox settings" \
  bash -c 'grep -q "sandbox_mode = \"workspace-write\"" "$1" &&
           grep -q "network_access = false" "$1"' _ "$codex_config"

# --- everything else ----------------------------------------------------------

echo "CLIs are executable:"
for cli in claude codex cursor-agent; do
  # Printed rather than only checked — the versions belong in the build log, so
  # a later report of "the review behaved oddly" can be tied to what was in the
  # image.
  if version=$("$cli" --version 2>&1); then
    printf '  ok    %-14s %s\n' "$cli" "$version"
  else
    printf '  FAIL  %-14s %s\n' "$cli" "$version"
    fail=1
  fi
done

echo "Scripts import:"
check "python modules" python3 -c "
import sys
sys.path.insert(0, '/scripts')
import backends, build_prompt, publish_review, review_scope, run_review
assert backends.BACKENDS == ('claude', 'codex', 'cursor'), backends.BACKENDS
"

echo "Prompt assets are present:"
for asset in \
  /scripts/AGENTS.md \
  /scripts/shared/methodology.md \
  /scripts/.agents/skills/SKILL.md; do
  check "$asset" test -f "$asset"
done

if [ "$fail" -ne 0 ]; then
  echo "smoke test FAILED" >&2
  exit 1
fi
echo "smoke test passed"
