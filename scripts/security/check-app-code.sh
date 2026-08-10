#!/bin/sh
# L5 custom fallback. Runs after Semgrep. Tested 2026-08-11 against a file
# holding all four cases:
#   - SQL and XSS: Semgrep with our rule packs did NOT flag them at all.
#   - path traversal and JWT: Semgrep did flag them at WARNING severity,
#     which the workflow's `--severity ERROR` filter drops.
# So in this pipeline these cases only reach the log via these greps.

set -u

FAILED=0

# SQL: real SQL structure with a `${...}` interpolation, not a bare keyword
# (which would flag every REST verb like DELETE / PUT / POST).
if git grep -nIE -e '(SELECT[[:space:]].*[[:space:]]FROM[[:space:]]|DELETE[[:space:]]+FROM[[:space:]]|INSERT[[:space:]]+INTO[[:space:]]|UPDATE[[:space:]]+[A-Za-z_."]+[[:space:]]+SET[[:space:]]|[[:space:]]WHERE[[:space:]]).*\$\{' \
  -- 'src/*.ts' 'src/*.tsx' 2>/dev/null; then
  echo "::error::SQL built by string interpolation — HIGH RISK of injection"
  echo "::error::Use parameterised queries or the Supabase query builder instead."
  FAILED=1
else
  echo "No critical SQL injection patterns found"
fi

# XSS: dangerouslySetInnerHTML. Warning-only — reviewers decide.
if git grep -nI -e 'dangerouslySetInnerHTML' -- 'src/*.tsx' 'src/*.jsx' 2>/dev/null; then
  echo "::warning::dangerouslySetInnerHTML found — ensure content is sanitized"
fi

# Path traversal: user-controllable input reaching path.join / fs.read / fs.write.
if git grep -nIE -e '(path\.join|path\.resolve|fs\.(read|write)[A-Za-z]*)\(.*(req|request)\.(body|query|params|nextUrl)' \
  -- 'src/*.ts' 'src/*.tsx' 2>/dev/null; then
  echo "::error::User input used to build a file path — path traversal risk"
  FAILED=1
else
  echo "No path traversal risks found"
fi

# Hardcoded signing secret passed positionally to jwt/createHmac.
if git grep -nIE -e '(jwt\.sign|jwt\.verify|createHmac)[[:space:]]*\([^)]*["'"'"'][A-Za-z0-9+/=_-]{8,}["'"'"']' \
  -- 'src/*.ts' 'src/*.tsx' 2>/dev/null; then
  echo "::error::Hardcoded signing secret passed to jwt/createHmac"
  FAILED=1
else
  echo "No hardcoded JWT secrets found"
fi

exit "$FAILED"
