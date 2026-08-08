#!/usr/bin/env bash
# Proves a built image can do its job. Runs in-image so the release workflow
# stays generic and a pulled image can be verified by hand:
#   docker run --rm ghcr.io/<owner>/<repo>/ai-code-review:v1 /smoke-test.sh
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
# Before any CLI, because `cursor-agent --version` *creates* a default config
# when none exists — checking after would always find a file. And by content,
# not existence: the generated default is permissive where ours is an allowlist,
# so a wrong $HOME silently drops the sandbox with nothing in the log.
echo "CLI configs are ours, not a generated default:"

cursor_config="${HOME:-/nonexistent}/.cursor/cli-config.json"
check "cursor  present at \$HOME/.cursor/cli-config.json" test -f "$cursor_config"
# Threshold only has to separate ours (~186 rules) from the ~1-rule default.
# $1 belongs to the inner bash; the path is a positional so a space can't re-split.
# shellcheck disable=SC2016
check "cursor  is the allowlist config, not the default" \
  bash -c 'grep -q "\"approvalMode\": \"allowlist\"" "$1" &&
           grep -q "Shell(sudo \*)" "$1" &&
           [ "$(grep -c "Shell(" "$1")" -gt 100 ]' _ "$cursor_config"

codex_config="${CODEX_HOME:-/nonexistent}/config.toml"
check "codex   present at \$CODEX_HOME/config.toml" test -f "$codex_config"
# $1 belongs to the inner bash.
# shellcheck disable=SC2016
check "codex   has the sandbox settings" \
  bash -c 'grep -q "sandbox_mode = \"workspace-write\"" "$1" &&
           grep -q "network_access = false" "$1"' _ "$codex_config"

# --- everything else ----------------------------------------------------------

echo "CLIs are executable:"
for cli in claude codex cursor-agent; do
  # Versions printed into the build log, so odd behaviour can be tied to a build.
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
