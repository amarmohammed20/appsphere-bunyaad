#!/bin/bash
# L2 custom secret patterns. Runs alongside Gitleaks and TruffleHog.
# Kept because those tools cover almost none of these patterns (2/13 for
# Gitleaks, 0/13 for TruffleHog under --only-verified, tested 2026-08-11).
#
# bash, not sh: needs array expansion. A plain string of pathspecs is
# shell-globbed against the repo root before git is invoked, so '*.ts'
# collapses to root-level files and everything under src/ is silently
# skipped. Quoted array expansion hands the patterns to git untouched.

set -u

echo "=== Custom secret pattern scan ==="
FOUND=0

CODE_PATHS=(
  '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs'
  '*.json' '*.yml' '*.yaml' '*.sh' '*.md'
)
# Self-exclusion: this workflow and its scripts contain the patterns.
EXCLUDES=(
  ':(exclude)scripts/security/**'
  ':(exclude).github/workflows/security-*'
)

# Reports file and line only. Printing the matched text would copy the secret
# into a workflow log that is retained for 90 days and readable by anyone with
# read access — and a red gate is exactly the log people open. `-l` would lose
# the line number, so the numbers are cut out of the -n output instead.
#
# -e is required so a pattern starting with '-' is not read as a flag.
indent() {
  while IFS= read -r line; do
    echo "  $line"
  done <<< "$1"
}

scan() {
  local desc="$1"
  local pattern="$2"
  local hits
  hits=$(git grep -nIE -e "$pattern" -- "${CODE_PATHS[@]}" "${EXCLUDES[@]}" 2>/dev/null \
    | cut -d: -f1,2 || true)
  if [ -n "$hits" ]; then
    echo "::error::$desc"
    indent "$hits"
    FOUND=1
  fi
}

# Localhost/127.0.0.1 connection strings are the local Supabase/Docker stack
# defaults documented in the docs and READMEs — not credentials.
DB_HITS=$(git grep -nIE -e '(postgres|postgresql|mysql|mongodb)://[^$[:space:]"'"'"']+:[^$[:space:]"'"'"']+@' -- "${CODE_PATHS[@]}" "${EXCLUDES[@]}" 2>/dev/null \
  | grep -vE '@(127\.0\.0\.1|localhost)([:/]|$)' | cut -d: -f1,2 || true)
if [ -n "$DB_HITS" ]; then
  echo "::error::Found hardcoded database connection string"
  indent "$DB_HITS"
  FOUND=1
fi

scan "Found hardcoded AWS credentials" \
  '(AKIA[0-9A-Z]{16}|aws_secret_access_key[[:space:]]*=[[:space:]]*["'"'"'][^$])'

scan "Found hardcoded Supabase access token" \
  'sbp_[A-Za-z0-9]{32,}'

scan "Found hardcoded Resend API key" \
  're_[A-Za-z0-9]{16,}_[A-Za-z0-9]{16,}'

scan "Found hardcoded OpenRouter API key" \
  'sk-or-v1-[A-Za-z0-9]{32,}'

# Left boundary matters: unanchored, `sk-` matches inside ordinary kebab-case
# prose — "task-management-dashboard-realtime-updates" reads as a key.
scan "Found hardcoded OpenAI API key" \
  '(^|[^A-Za-z0-9_-])sk-(proj-)?[A-Za-z0-9_-]{32,}'

scan "Found hardcoded Anthropic API key" \
  'sk-ant-[A-Za-z0-9_-]{32,}'

scan "Found hardcoded Slack token" \
  'xox[baprs]-[A-Za-z0-9-]{10,}'

scan "Found hardcoded Slack webhook URL" \
  'hooks\.slack\.com/services/[A-Za-z0-9/]{20,}'

scan "Found hardcoded Authorization bearer token" \
  '[Aa]uthorization["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"']Bearer [A-Za-z0-9._-]{20,}["'"'"']'

# Secret name assigned a literal instead of process.env.
scan "Found a secret assigned a literal value instead of process.env" \
  '(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_URL|RESEND_API_KEY|OPENROUTER_API_KEY|SLACK_BOT_TOKEN|COMPANIES_HOUSE_[A-Z_]*)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][^$][^"'"'"']{8,}'

# service_role JWT bypasses row level security.
SERVICE_ROLE_HITS=$(git grep -nI -e 'service_role' -- "${CODE_PATHS[@]}" "${EXCLUDES[@]}" 2>/dev/null \
  | grep -E 'eyJ[A-Za-z0-9_-]{20,}' | cut -d: -f1,2 || true)
if [ -n "$SERVICE_ROLE_HITS" ]; then
  echo "::error::Found hardcoded Supabase service_role key — this bypasses RLS entirely"
  indent "$SERVICE_ROLE_HITS"
  FOUND=1
fi

# Private keys: scan every tracked file, extension-independent.
PRIVATE_KEY_HITS=$(git grep -nIE -e '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----' -- . "${EXCLUDES[@]}" 2>/dev/null \
  | cut -d: -f1,2 || true)
if [ -n "$PRIVATE_KEY_HITS" ]; then
  echo "::error::Found embedded private key"
  indent "$PRIVATE_KEY_HITS"
  FOUND=1
fi

# .env.example holds placeholders; .env.vault holds encrypted values.
COMMITTED_ENV=$(git ls-files | grep -E '(^|/)\.env($|\.)' \
  | grep -vE '\.env\.example$|\.env\.vault$' || true)
if [ -n "$COMMITTED_ENV" ]; then
  echo "::error::Environment file committed to the repository:"
  echo "$COMMITTED_ENV"
  FOUND=1
fi

if [ "$FOUND" -eq 1 ]; then
  exit 1
fi
echo "No hardcoded secrets detected"
