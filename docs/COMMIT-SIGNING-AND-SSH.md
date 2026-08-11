# Commit Signing & SSH Setup — Windows (Git Bash)

Mandatory for every engineer. All commits must show **Verified** on GitHub. Do every step in order, in **Git Bash** (right-click in the repo folder → _Open Git Bash here_). ~15 min.

---

## Step 1 — Git email must be verified on GitHub

1. Run:
   ```bash
   git config --global user.email
   ```
2. Open <https://github.com/settings/emails>.
3. The email printed in 1 must appear there **without** an "Unverified" label.
   - If it's missing → **Add email address**, click the link in the verification email GitHub sends you.
   - If you want a different email → `git config --global user.email "you@example.com"` (then verify that one).

Done when: the email from step 1 is listed and verified on that page.

---

## Step 2 — SSH key

1. Check if you already have one:
   ```bash
   ls ~/.ssh/id_ed25519.pub
   ```
   If it prints a path → skip to 3. If it prints `No such file` → do 2.
2. Generate:
   ```bash
   ssh-keygen -t ed25519 -C "you@example.com"
   ```
   - `Enter file in which to save` → press **Enter**
   - `Enter passphrase` → type a passphrase (mandatory), press **Enter**, repeat it
3. Print the public key and copy the entire output line:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
4. Open <https://github.com/settings/ssh/new>
   - **Title**: your machine name, e.g. `work-laptop`
   - **Key type**: `Authentication Key`
   - **Key**: paste
   - Click **Add SSH key**
5. Test:
   ```bash
   ssh -T git@github.com
   ```
   - If asked `Are you sure you want to continue connecting?` → type `yes`, Enter.

Done when: it prints `Hi <your-username>! You've successfully authenticated...`

---

## Step 3 — Switch the repo remote to SSH

1. ```bash
   git remote set-url origin git@github.com:amarmohammed20/appsphere-bunyaad.git
   ```
2. ```bash
   git fetch origin
   ```
   (passphrase prompt appears — type the one from Step 2)

Done when: `git fetch origin` completes without asking for a GitHub username/password.

---

## Step 4 — Generate GPG key

1. Run:
   ```bash
   gpg --full-generate-key
   ```
2. Answer each prompt exactly:

   | You'll see                                | Type                               |
   | ----------------------------------------- | ---------------------------------- |
   | `Please select what kind of key you want` | `9` then Enter                     |
   | `Please select which elliptic curve`      | `1` then Enter                     |
   | `Key is valid for? (0)`                   | `2y` then Enter                    |
   | `Is this correct? (y/N)`                  | `y`                                |
   | `Real name:`                              | your full name                     |
   | `Email address:`                          | the email from **Step 1**, exactly |
   | `Comment:`                                | just press Enter                   |
   | `(O)kay/(Q)uit?`                          | `O`                                |
   | Passphrase popup window                   | type a passphrase twice, OK        |

3. Get your key ID:
   ```bash
   gpg --list-secret-keys --keyid-format=long
   ```
   In the output line `sec   ed25519/XXXXXXXXXXXXXXXX 2026-...`, the 16 characters after `ed25519/` are your **KEY ID**. Copy it.

---

## Step 5 — Add the GPG key to GitHub

1. Print the public key (replace `KEYID` with yours):
   ```bash
   gpg --armor --export KEYID
   ```
2. Copy the **entire** output — from `-----BEGIN PGP PUBLIC KEY BLOCK-----` to `-----END PGP PUBLIC KEY BLOCK-----` inclusive.
3. Open <https://github.com/settings/gpg/new>
   - **Title**: `work-laptop`
   - **Key**: paste
   - Click **Add GPG key**

Done when: the key appears on the page with your email next to it and no "unverified" warning. (If "unverified" → your Step 1 email doesn't match — fix and redo Step 4.)

---

## Step 6 — Configure git to sign everything

Run all three (replace `KEYID`):

```bash
git config --global user.signingkey KEYID
```

```bash
git config --global commit.gpgsign true
```

```bash
git config --global tag.gpgsign true
```

---

## Step 7 — Test

1. ```bash
   git commit --allow-empty -m "test: signed commit"
   ```
   (passphrase popup appears — type it)
2. ```bash
   git log --show-signature -1
   ```
   Must contain: `gpg: Good signature from "Your Name <your email>"`
3. Remove the test commit:
   ```bash
   git reset --soft HEAD~1
   ```

Done when: step 2 shows `Good signature`. From now on every commit signs automatically.

---

## Step 8 — Vigilant mode

1. Open <https://github.com/settings/keys>
2. Scroll to the bottom → tick **Flag unsigned commits as unverified**.

**Setup complete.** Your next pushed commit will show a green **Verified** badge on GitHub.

---

## Admin only — repo-level enforcement (@amarmohammed20, one-time)

Do this **only after every engineer has finished Steps 1–8** (otherwise they're blocked from merging).

1. Open <https://github.com/amarmohammed20/appsphere-bunyaad/settings/rules>
2. Click **New ruleset → New branch ruleset**
3. Fill in:
   - **Ruleset Name**: `Require signed commits`
   - **Enforcement status**: `Active`
   - **Target branches** → **Add target** → **Include default branch**
   - Under **Rules**: tick **Require signed commits**
4. Click **Create**

After this, GitHub itself rejects unsigned commits on `main` — hooks or `--no-verify` can't bypass it. For any **new repo**, repeat these 4 steps on that repo (or create one org-level ruleset once the repos move into a GitHub organization).

Local layer (already in this repo): `.husky/pre-commit` blocks commits in any clone where signing isn't configured, and points people to this doc.

---

## If something breaks

| Problem                                                | Do this                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error: gpg failed to sign the data`                   | Commit from **Git Bash**, not PowerShell/CMD. Still failing → `gpgconf --kill gpg-agent`, retry.                                                       |
| Commit shows **Unverified** on GitHub                  | Run `git log -1 --format='%ae'` — that email must be verified on GitHub (Step 1) and match your GPG key (Step 4).                                      |
| Commit has no badge at all                             | Signing was off for that commit. Run Step 6, then `git commit --amend --no-edit -S` and `git push --force-with-lease`.                                 |
| Merge blocked: _commits must have verified signatures_ | `git rebase --exec 'git commit --amend --no-edit -n -S' origin/main` then `git push --force-with-lease`                                                |
| Passphrase asked too often                             | `printf 'default-cache-ttl 28800\nmax-cache-ttl 86400\n' > ~/.gnupg/gpg-agent.conf` then `gpgconf --kill gpg-agent` (8-hour cache)                     |
| VS Code commit fails to sign                           | VS Code settings → search "commit signing" → enable **Git: Enable Commit Signing**. Make one commit from Git Bash first so the passphrase gets cached. |
| Key expired                                            | `gpg --edit-key KEYID` → type `expire` → `2y` → `save`, then redo Step 5.                                                                              |
| New laptop                                             | Repeat Steps 2–8 with fresh keys; delete the old keys at <https://github.com/settings/keys>.                                                           |
