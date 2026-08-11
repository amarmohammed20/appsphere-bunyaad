# Security pipeline

One workflow (`.github/workflows/security-gate.yml`), one job, six layers.
Runs on every PR to `main` and every push to `main`. Every step is
`if: always()` — one run reports every layer.

Two kinds of step exist:

- **Tool** — an off-the-shelf scanner from Sam Clusker's recommendations,
  pinned by digest.
- **Custom** — a script in `scripts/security/`. Only kept when no tool covers
  the case in our configuration.

Within each layer the tools run first, then the custom script.

## The map

| Layer | Tools                                   | Custom script                                          | Why the custom exists                                                                                                                           |
| ----- | --------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| L1    | none                                    | `check-build-config-diff.sh`                           | No tool detects the incident this repo suffered — obfuscated JS injected behind whitespace in `postcss.config.mjs`.                             |
| L2    | Gitleaks, TruffleHog                    | `check-secrets.sh`                                     | Tested 2026-08-11: Gitleaks caught 2 of 13 patterns, TruffleHog caught 0 (`--only-verified` never fires on synthetic values).                   |
| L3    | `pnpm audit` (prod + dev)               | `check-supply-chain-settings.mjs`, `check-lockfile.sh` | No tool reads `pnpm-workspace.yaml` policy, and none checks `.npmrc` for a substituted registry.                                                |
| L4    | ShellCheck, actionlint, zizmor, checkov | `check-workflow-integrity.sh`                          | zizmor + checkov cover most of what we used to hand-write. Kept: log-leaked credentials, `curl \| sh`, env dumps, `--no-verify` — none audited. |
| L5    | Semgrep (10 rule packs)                 | `check-app-code.sh`                                    | Tested 2026-08-11: Semgrep missed SQL and XSS entirely; found path traversal and JWT but only at WARNING, which our `--severity ERROR` drops.   |
| L6    | Trivy filesystem, Trivy config          | none                                                   | A Compose analyser used to live here — deleted once Trivy config covered the same rules.                                                        |

## The `scripts/security/` folder

| Script                            | Called from                                    |
| --------------------------------- | ---------------------------------------------- |
| `check-build-config.sh`           | pre-commit hook + `check-build-config-diff.sh` |
| `check-build-config-diff.sh`      | L1                                             |
| `check-secrets.sh`                | L2                                             |
| `check-supply-chain-settings.mjs` | L3                                             |
| `check-lockfile.sh`               | L3                                             |
| `check-workflow-integrity.sh`     | L4                                             |
| `check-app-code.sh`               | L5                                             |
| `setup-signed-commits.sh`         | developer setup (not CI)                       |

Every script is linted by ShellCheck at L4, so a quoting bug in a security
script cannot ship silently.

## When cloning this repo into a new project

Edit these — they name this repository or its people, and nothing fails if you
forget, so they are easy to miss:

- **`.github/CODEOWNERS`** — replace every owner with the new project's.
- **`docs/COMMIT-SIGNING-AND-SSH.md`** — the repository URLs.
- **`renovate.json`** — nothing to edit, but install the Renovate GitHub App or
  the config does nothing.

Then, in the new repository's settings:

- Require a pull request before merging `main`, require the security gate as a
  status check, and tick **"Do not allow bypassing"** — without that last one
  an admin push skips every layer here.
- Require review from code owners, or `CODEOWNERS` is decoration.
- Turn on Dependabot security alerts. Free, and the only thing watching for a
  CVE published against a dependency already installed.

## Rule for future changes

Before deleting any custom script, prove the tool covers the same case at the
same severity, with a run against a deliberately vulnerable file. If the tool
misses even one, keep the custom step and update the "Why" column above with
the tool tested and what it missed. That answers "why is this still here?"
without redoing the audit.
