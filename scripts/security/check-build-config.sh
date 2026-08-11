#!/bin/sh
# ============================================================================
# Build config integrity checker
# ============================================================================
# Shared by the pre-commit hook, the Security Gate CI job, and the scheduled
# main-branch health check. Keeping one copy means the three can never drift
# apart and disagree about what "clean" means.
#
# Exit 0 = clean. Exit 1 = possible infection, caller must not run the build.
#
# Background: a compromised developer machine injected obfuscated JavaScript
# into postcss.config.mjs, hidden behind a long run of spaces so the file
# looked untouched at a glance. It executed on every `npm run build` with full
# Node access and exfiltrated .env files, SSH keys and git credentials. Every
# check below targets some part of that pattern.
# ============================================================================

set -u

INFECTED=0

# file:max_bytes
# Limits are set with headroom above the real sizes in this repo, so ordinary
# edits do not trip the check while an injected payload (which runs to
# kilobytes of obfuscated code) still does.
#   Actual sizes in this repo when written: postcss.config.mjs 94,
#   next.config.ts 2207, eslint.config.mjs 3405, eslint.boundaries.mjs 6130.
#   (No tailwind config file — Tailwind v4 is configured in globals.css.)
#
# Size alone is a weak signal and must not be relied on: a working exfiltration
# stub fits in roughly 150 bytes, comfortably under any limit that still allows
# ordinary edits. The pattern checks below are what actually catch a small
# payload. postcss is held close to its real size because it is the file that
# was infected twice and has no reason to grow.
LIMITS="
postcss.config.js:200
postcss.config.mjs:200
postcss.config.cjs:200
next.config.ts:4000
next.config.js:4000
next.config.mjs:4000
tailwind.config.js:6000
tailwind.config.ts:6000
tailwind.config.mjs:6000
eslint.config.mjs:6000
eslint.config.js:6000
eslint.config.ts:6000
eslint.boundaries.mjs:8000
babel.config.js:2000
webpack.config.js:4000
"

echo "Checking build configs for injected code..."

for entry in $LIMITS; do
  file="${entry%%:*}"
  max="${entry##*:}"
  [ -f "$file" ] || continue

  size=$(wc -c < "$file" | tr -d ' ')
  echo "  - $file (${size} bytes)"

  if [ "$size" -gt "$max" ]; then
    echo "    BLOCK: ${size} bytes exceeds the ${max} byte limit — possible injected payload"
    INFECTED=1
  fi

  # The signature of the actual attack: a long run of whitespace used to push
  # the payload off the visible edge of the editor. Checking for the padding
  # itself catches it wherever it sits, including on the same line as the
  # export, which a line-position check misses entirely.
  if grep -qE '[[:space:]]{40,}[^[:space:]]' "$file"; then
    echo "    BLOCK: long whitespace run followed by code — space-padding attack"
    INFECTED=1
  fi

  # Obfuscated payloads are emitted as a single very long line.
  longest=$(awk '{ if (length($0) > m) m = length($0) } END { print m+0 }' "$file")
  if [ "$longest" -gt 500 ]; then
    echo "    BLOCK: ${longest}-character line — likely obfuscated payload"
    INFECTED=1
  fi

  # Content living past the end of the config block. The pattern has to treat
  # `export default` and `module.exports` as valid endings, otherwise every
  # ESM config trips this.
  last=$(grep -nE '^[[:space:]]*[});]+[[:space:]]*$|^export default|^module\.exports' "$file" | tail -1 | cut -d: -f1)
  if [ -n "$last" ]; then
    total=$(wc -l < "$file" | tr -d ' ')
    if [ "$total" -gt "$last" ]; then
      trailing=$(tail -n +"$((last + 1))" "$file" | tr -d ' \n\r\t;(){}')
      if [ -n "$trailing" ]; then
        echo "    BLOCK: content found after the config block closes"
        INFECTED=1
      fi
    fi
  fi

  # createRequire appeared in both infections. A clean config never needs it.
  if grep -q 'createRequire' "$file"; then
    echo "    BLOCK: contains createRequire — known infection signature"
    INFECTED=1
  fi

  # Execution and decoding primitives. A build config has no reason to hold any
  # of these, and the payload needed them to unpack and run itself.
  #
  # Bare import( and require( are deliberately NOT matched here. Loading a
  # module is ordinary in these files — tailwind.config loads plugins with
  # require(), and a JSDoc `@type {import('tailwindcss').Config}` annotation is
  # just a type. What matters is WHICH module is loaded, and that is covered by
  # the built-in module check below. Matching the call itself only produced
  # false positives on legitimate configs, which is how a check gets ignored.
  if grep -qE 'eval[[:space:]]*\(|new[[:space:]]+Function|child_process|execSync|spawnSync|[^a-zA-Z]atob[[:space:]]*\(|Buffer\.from[[:space:]]*\([^)]*base64' "$file"; then
    echo "    BLOCK: contains a code-execution or decoding primitive"
    INFECTED=1
  fi

  # A module specifier assembled at runtime, e.g. import('nod'+'e:https').
  # Legitimate code names the module it wants as a literal; building the string
  # exists only to keep it away from the check below.
  if grep -qE '(import|require)[[:space:]]*\([^)]*\+' "$file"; then
    echo "    BLOCK: module specifier built by concatenation — obfuscation"
    INFECTED=1
  fi

  # Network egress from a build config is exfiltration by definition.
  # Matching 'https?\.' broadly rather than only '.request' matters: https.get,
  # http.get and any other method on those modules are the same capability, and
  # an exfil stub that fits in ~150 bytes has no reason to prefer .request.
  if grep -qE 'fetch[[:space:]]*\(|https?\.|axios|net\.connect|dgram|WebSocket|XMLHttpRequest|sendBeacon|node:(https?|net|dgram|dns)' "$file"; then
    echo "    BLOCK: makes network calls — possible exfiltration"
    INFECTED=1
  fi

  # Node built-in modules that give a config filesystem, network or process
  # access. Both the bare specifier ('fs') and the prefixed one ('node:fs') are
  # matched, across all three ways a module is loaded: a static `from 'fs'`,
  # `require('fs')`, and a dynamic `import('fs')`. Matching only from/require
  # left `const f = await import('fs')` uncovered, which — with the module
  # aliased to a variable so `https.`/`net.connect` never appear literally — was
  # enough to read .env and exfiltrate from a non-postcss config undetected.
  #
  # This is keyed on the module NAME, not the call, so it does not fire on a
  # JSDoc `@type {import('tailwindcss').Config}`: tailwindcss is not a built-in.
  #
  # path and url are deliberately absent: eslint.config.mjs imports them for
  # dirname/fileURLToPath, and neither reads files nor reaches the network.
  if grep -qE "(from|require[[:space:]]*\(|import[[:space:]]*\()[[:space:]]*[\"'](node:)?(fs|dns|net|dgram|http|https|tls|child_process|worker_threads|vm|cluster)[\"']" "$file"; then
    echo "    BLOCK: imports a Node built-in with filesystem, network or process access"
    INFECTED=1
  fi

  # Filesystem writes. The real infection staged its work by writing
  # temp_auto_push.bat files, which needs no network call at all — so a check
  # that only looks for egress misses the incident's own signature move.
  if grep -qE '[^a-zA-Z_.](write|append)FileSync|[^a-zA-Z_.](write|append)File[[:space:]]*\(|createWriteStream|\.bat[\"'"'"']|mkdirSync' "$file"; then
    echo "    BLOCK: writes to the filesystem — a config has no reason to"
    INFECTED=1
  fi

  # Identifiers assembled from string fragments, e.g. globalThis["fet"+"ch"].
  # Legitimate config never builds a property name this way; it exists purely to
  # keep the literal name out of reach of the checks above.
  if grep -qE '\[[[:space:]]*["'"'"'][^"'"'"']*["'"'"'][[:space:]]*\+|globalThis[[:space:]]*\[' "$file"; then
    echo "    BLOCK: property name built from concatenated strings — obfuscation"
    INFECTED=1
  fi

  # Reading credentials inside a build config. next.config legitimately reads
  # process.env for public build flags, so this is limited to the config files
  # that have no reason to touch the environment at all.
  case "$file" in
    postcss.config.*|tailwind.config.*|babel.config.*)
      if grep -qE 'process\.env|process\[' "$file"; then
        echo "    BLOCK: reads process.env — this config has no reason to"
        INFECTED=1
      fi
      ;;
  esac

  # postcss.config is handled as an ALLOWLIST rather than a denylist.
  #
  # Every check above is a denylist of known-bad primitives, and a denylist
  # always loses to the next specifier nobody thought of. postcss.config is the
  # file that was actually infected, twice, and it has exactly one legitimate
  # shape: a plugins object assigned to an export. In all three repos it is
  # around 100 bytes and contains no import, no require, and not a single call
  # expression. That makes it narrow enough to describe what is allowed instead
  # of guessing at what is forbidden.
  #
  # A legitimate change here is adding a plugin to the object, which needs no
  # parentheses. If a genuinely new shape is ever required (an array with
  # require() calls, say), that is worth a human look rather than a silent pass.
  case "$file" in
    postcss.config.*)
      stripped=$(sed 's://.*::' "$file" | tr -d ' \t\n\r')
      if printf '%s' "$stripped" | grep -qE '\(|import|require'; then
        echo "    BLOCK: postcss config contains a call, import or require —"
        echo "           the only expected shape is a plugins object and an export."
        INFECTED=1
      fi
      ;;
  esac
done

if [ "$INFECTED" -eq 1 ]; then
  echo ""
  echo "BUILD CONFIG INTEGRITY CHECK FAILED"
  echo "Do not run 'npm run build' or 'npm run dev' until this is resolved —"
  echo "both execute these files. Raise it with a code owner (.github/CODEOWNERS)."
  exit 1
fi

echo "Build configs are clean."
exit 0
