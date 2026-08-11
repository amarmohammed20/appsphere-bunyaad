#!/bin/sh

# ============================================================================
# Signed commits + SSH auth — engineer onboarding script
# ============================================================================
# Interactive companion to docs/COMMIT-SIGNING-AND-SSH.md. Run from the repo
# root in Git Bash (Windows) or any POSIX shell (macOS/Linux):
#
#   sh scripts/security/setup-signed-commits.sh
#
# What it does:
#   1. Ensures an SSH key exists (offers to generate one)
#   2. Switches the repo remote from HTTPS to SSH
#   3. Configures commit signing (SSH signing by default, GPG if chosen)
#   4. Prints exactly which public keys to paste into GitHub, and where
#   5. Verifies the final git config
#
# It never uploads anything — adding keys to GitHub is always a manual,
# visible step in the browser.
# ============================================================================

set -e

say()  { printf '\n%s\n' "$1"; }
ask()  { printf '%s ' "$1"; read -r REPLY; }

SSH_KEY="$HOME/.ssh/id_ed25519"

say "=== AppSphere signed-commit setup ==="
say "Full guide: docs/COMMIT-SIGNING-AND-SSH.md"

# ---------------------------------------------------------------------------
# 0. Identity
# ---------------------------------------------------------------------------
GIT_EMAIL=$(git config user.email || true)
say "Your git commit email is: ${GIT_EMAIL:-<not set>}"
echo "This MUST be a verified email on your GitHub account, or commits will"
echo "show as Unverified even when correctly signed."
ask "Is that email verified on your GitHub account? [y/N]"
if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
  echo "Fix it first:  git config --global user.email you@example.com"
  echo "and verify it at https://github.com/settings/emails — then re-run."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. SSH key
# ---------------------------------------------------------------------------
if [ -f "$SSH_KEY" ]; then
  say "[1/5] Found existing SSH key: $SSH_KEY"
else
  say "[1/5] No SSH key at $SSH_KEY — generating one."
  echo "Use a passphrase: an unencrypted key on a stolen laptop is a full"
  echo "GitHub credential."
  ssh-keygen -t ed25519 -C "$GIT_EMAIL" -f "$SSH_KEY"
fi

say "Add this AUTHENTICATION key to GitHub (Settings > SSH and GPG keys >"
echo "New SSH key > Key type: Authentication Key):"
echo "------------------------------------------------------------------"
cat "${SSH_KEY}.pub"
echo "------------------------------------------------------------------"
ask "Press Enter once it is added..."

# ---------------------------------------------------------------------------
# 2. Remote HTTPS -> SSH
# ---------------------------------------------------------------------------
REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
case "$REMOTE_URL" in
  https://github.com/*)
    SSH_URL="git@github.com:${REMOTE_URL#https://github.com/}"
    say "[2/5] Switching origin from HTTPS to SSH:"
    echo "  $REMOTE_URL -> $SSH_URL"
    git remote set-url origin "$SSH_URL"
    ;;
  git@github.com:*)
    say "[2/5] Remote already uses SSH: $REMOTE_URL"
    ;;
  *)
    say "[2/5] Unrecognised remote '$REMOTE_URL' — leaving it untouched."
    ;;
esac

say "Testing SSH auth (expect a greeting with your username)..."
# ssh -T exits 1 on success (no shell access), so don't let set -e kill us.
ssh -T git@github.com 2>&1 | head -n 2 || true

# ---------------------------------------------------------------------------
# 3. Signing method
# ---------------------------------------------------------------------------
say "[3/5] Commit signing method:"
echo "  1) SSH signing  — reuses the key above, no extra software (recommended)"
echo "  2) GPG signing  — requires GnuPG/Gpg4win, you manage a separate keypair"
ask "Choose [1/2] (default 1):"

if [ "$REPLY" = "2" ]; then
  # --- GPG path ---
  if ! command -v gpg >/dev/null 2>&1; then
    echo "gpg not found. Install it first (Windows: Gpg4win, macOS: brew"
    echo "install gnupg) and re-run. Or re-run and choose SSH signing."
    exit 1
  fi
  say "Existing GPG secret keys:"
  gpg --list-secret-keys --keyid-format=long || true
  ask "Enter the key ID to use (blank to generate a new key):"
  KEY_ID="$REPLY"
  if [ -z "$KEY_ID" ]; then
    echo "Generating — pick: ECC (sign and encrypt) > Curve 25519 > 2y expiry,"
    echo "and use your GitHub-verified email ($GIT_EMAIL)."
    gpg --full-generate-key
    KEY_ID=$(gpg --list-secret-keys --keyid-format=long "$GIT_EMAIL" 2>/dev/null \
      | awk '/^sec/ {split($2,a,"/"); print a[2]; exit}')
    [ -n "$KEY_ID" ] || { echo "Could not detect the new key ID — configure manually per the doc."; exit 1; }
  fi
  git config --global gpg.format openpgp
  git config --global user.signingkey "$KEY_ID"
  # Windows: git often finds Git Bash's gpg, not Gpg4win's agent-backed one.
  GPG4WIN="/c/Program Files (x86)/GnuPG/bin/gpg.exe"
  if [ -f "$GPG4WIN" ]; then
    git config --global gpg.program "C:/Program Files (x86)/GnuPG/bin/gpg.exe"
  fi
  say "Add this GPG PUBLIC key to GitHub (Settings > SSH and GPG keys >"
  echo "New GPG key):"
  echo "------------------------------------------------------------------"
  gpg --armor --export "$KEY_ID"
  echo "------------------------------------------------------------------"
else
  # --- SSH signing path (default) ---
  git config --global gpg.format ssh
  git config --global user.signingkey "${SSH_KEY}.pub"
  say "Add the SAME public key to GitHub AGAIN as a SIGNING key"
  echo "(Settings > SSH and GPG keys > New SSH key > Key type: Signing Key)."
  echo "GitHub treats authentication and signing keys as separate entries:"
  echo "------------------------------------------------------------------"
  cat "${SSH_KEY}.pub"
  echo "------------------------------------------------------------------"
fi
ask "Press Enter once it is added..."

git config --global commit.gpgsign true
git config --global tag.gpgsign true

# ---------------------------------------------------------------------------
# 4. Verify with a test commit
# ---------------------------------------------------------------------------
say "[4/5] Creating a signed empty test commit..."
if git commit --allow-empty -m "test: verify commit signing" >/dev/null 2>&1; then
  git log --show-signature -1 | head -n 8 || true
  git reset --soft HEAD~1
  echo "(test commit removed again)"
else
  echo "Test commit failed — signing is misconfigured. See the Troubleshooting"
  echo "table in docs/COMMIT-SIGNING-AND-SSH.md."
  exit 1
fi

# ---------------------------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------------------------
say "[5/5] Final configuration:"
echo "  user.email       = $(git config user.email)"
echo "  gpg.format       = $(git config gpg.format || echo openpgp)"
echo "  user.signingkey  = $(git config user.signingkey)"
echo "  commit.gpgsign   = $(git config commit.gpgsign)"
echo "  origin           = $(git remote get-url origin)"
say "Done. Last manual steps on GitHub:"
echo "  1. Enable vigilant mode: Settings > SSH and GPG keys >"
echo "     'Flag unsigned commits as unverified'"
echo "  2. Push a commit and confirm the green Verified badge."
