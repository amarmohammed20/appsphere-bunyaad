# Bunyaad TODO

Every candidate item for the boilerplate. Tick what we do; strike or delete what we decide against.
Source: App Build Guard Rails.

## 1. GitHub repo settings

- [x] Enable branch protection on `main` — ruleset `protect-main`, active
- [x] Require a pull request before merging
- [x] Require at least 1 approving review
- [x] Dismiss stale reviews when new commits are pushed
- [x] Require status checks to pass before merging — `pr-checks / Verify`
- [x] Require branches to be up to date before merging
- [x] Block direct pushes to `main`
- [x] Disallow bypassing — bypass list is empty, admins included
- [ ] Prove it: open a PR with broken code, confirm the merge button is greyed
- [ ] Enable auto-delete head branches
- [ ] Enable "Template repository" so new projects use "Use this template"

## 2. PR template

- [ ] Add `.github/pull_request_template.md`
- [ ] Include what/why/type-of-change sections
- [ ] Include testing and screenshot sections
- [ ] Include checklist: lint rules, tests, docs, branch up to date

## 3. pnpm setup

- [x] Pin pnpm version in `package.json` via Corepack
- [x] Add `preinstall: npx only-allow pnpm`
- [ ] Verify `only-allow` actually blocks a real `npm install`
- [ ] Document npm-to-pnpm command mapping in README

## 4. ESLint and Prettier

- [x] `@typescript-eslint`, react, react-hooks, import plugins — all bundled by `eslint-config-next`
- [x] Add Prettier + `eslint-config-prettier` (no `eslint-plugin-prettier` — Prettier discourages it)
- [x] Add `prettier-plugin-tailwindcss` for class sorting
- [x] Add `.prettierrc`
- [x] Add `.prettierignore`
- [x] Rule: `@typescript-eslint/no-unused-vars` with `^_` ignore pattern
- [x] Rule: `@typescript-eslint/no-explicit-any` as error
- [x] Rule: `@typescript-eslint/consistent-type-imports` as error
- [x] Rule: `import/order` with grouping, newlines, alphabetise
- [x] Rule: `no-console` as warn, allowing `warn`/`error`
- [x] Add `type-check` script
- [x] Add `lint` and `lint:fix` scripts
- [x] Add `format` and `format:check` scripts
- [ ] Consider type-aware linting (`no-floating-promises`, `no-misused-promises`) — costs lint speed
- [ ] Consider stricter tsconfig flags (`noUncheckedIndexedAccess`, `noImplicitOverride`)

## 5. Environments and Supabase

- [x] Run `supabase init` and commit `config.toml` (analytics off — flaky on
      Windows Docker; `schema_paths` on for declarative schemas)
- [x] Create `supabase/migrations/` — first migration generated from
      `supabase/schemas/users.sql` via `pnpm db:diff`, never hand-written
- [x] Add `lib/supabase/client.ts`
- [x] Add `lib/supabase/server.ts`
- [x] Add `lib/supabase/proxy.ts`
- [x] Add `proxy.ts` for session refresh (Next 16 renamed middleware to proxy)
- [x] Generate `src/types/database.types.ts` from the real schema (`pnpm db:types`)
- [x] Add script to generate Supabase types
- [x] Add DB scripts: start, stop, reset, diff, push, types
- [x] Add `features/users` CRUD as the DB-backed reference — create, read,
      role update, delete all verified in the browser against local Postgres
- [ ] Replace demo-public RLS policies with authenticated ones when auth lands
- [x] Deleted `features/contact` — `users` is the single reference (full CRUD
      plus an api/ handler; contact also queried a table no migration created).
      Canary, features README and CLAUDE.md repointed.
- [x] Add `.env.example` with all required keys
- [x] Add `lib/env.ts` — validates only when Supabase is configured, so a fresh clone runs
- [ ] Document three-environment setup (local, staging, production)
- [ ] Document migration promotion workflow (local → staging → production)
- [ ] Create staging and production Supabase projects
- [ ] Set Vercel environment variables per tier

## 6. GitHub Actions CI

- [x] Add `.github/workflows/pr-checks.yml` — calls the reusable workflow, dogfooding it
- [x] CI job: lint
- [x] CI job: type-check
- [x] CI job: build
- [x] CI job: format:check
- [x] CI job: test:boundaries
- [x] CI job: secret scan on the diff, before install so it fails fast
- [x] CI job: reject a branch that has not merged its base
- [x] Use `pnpm install --frozen-lockfile` in CI
- [x] Cache pnpm store in CI
- [x] Pin every action to a commit SHA, not a tag
- [x] CI job: fail if any action is referenced by tag instead of commit
      (`check:actions`). Appsphere's version treats `@v4` as pinned and only
      warns, which is why its own workflows are still unpinned.
- [ ] Port the rest of appsphere's security gate: lockfile integrity,
      supply-chain settings intact, `pnpm audit`, Semgrep, Trivy
- [x] Convert workflows to reusable (`workflow_call`) for client repos
- [x] Document how client repos reference them — docs/reusable-workflows.md
- [ ] Tag `v1` once this merges: `git tag -f v1 && git push origin v1 --force`
- [ ] Make `pr-checks / Verify` a required status check on `main` — that exact
      string. GitHub builds it from the caller job id and the called job name;
      typing `Verify` creates a check that never reports and blocks every PR.
- [ ] Protect `refs/tags/v1` against force-push, and cut releases as immutable
      `v1.x` tags. Whoever can move `v1` runs code in every consuming repo.
- [ ] Add `actions/dependency-review-action` — free on public repos, fails a PR
      that adds a known-vulnerable or known-malicious dependency
- [ ] Add `lockfile-lint` — assert every lockfile entry resolves to
      registry.npmjs.org over https. `--frozen-lockfile` checks the lockfile
      matches package.json, not that the URLs in it are legitimate
- [ ] Add `actionlint` — nothing currently validates the workflows themselves;
      it would have caught the merge-commit and context bugs mechanically
- [ ] Add Vitest and one smoke test, then a `pnpm test` step with no
      `--if-present`. Omitting it silently means a repo can add tests that
      never run, and the design says this file is not edited per-repo
- [ ] Build-time env validation, so `next build` in CI proves the app cannot be
      deployed with missing Supabase config
- [ ] Prove it end to end: open a throwaway repo that calls `@v1` and watch it run
- [x] Add PR DB migrations pipeline — ported from itc as a reusable workflow
      (`db-checks / Verify`): alignment vs the hosted project, full rebuild
      from migrations + seed in CI, smoke checks, dry-run push, and red until
      production is actually pushed
- [x] CI check: fail a migration that creates a table without enabling RLS
      (`pnpm check:rls`, verified with a deliberately leaky migration)
- [ ] Add repo secrets SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF, then
      prove db-checks end to end on a real PR
- [ ] Add migration file naming/format check
- [ ] Add check for unpushed migration candidates
- [ ] Add PR policy workflow (title, labels, size)
- [ ] Add Slack notification workflow
- [ ] Add scheduled security workflow

## 7. Supply chain security

- [x] Add `minimumReleaseAge` to `pnpm-workspace.yaml` (set to 3 days)
- [ ] Raise `minimumReleaseAge` from 4320 to 10080 once dependencies settle
- [x] Add `blockExoticSubdeps` to `pnpm-workspace.yaml`
- [ ] Re-enable `trustPolicy: no-downgrade` — blocked by `eslint-import-resolver-typescript` inside `eslint-config-next`
- [x] Add `allowBuilds` allowlist to `pnpm-workspace.yaml`
- [x] Add `.npmrc` with `save-exact=true`
- [x] Add `.npmrc` with `registry=https://registry.npmjs.org/`
- [ ] Add Socket Firewall to CI
- [ ] Document Socket Firewall install on dev machines
- [ ] Document `pnpm store prune` after installing a scanner
- [ ] Document lockfile rules (never gitignore, review diffs)
- [ ] Document upgrade habits (one at a time, changelog, audit)
- [ ] Document dependency minimisation policy
- [ ] Document `.vscode/tasks.json` inspection before opening unfamiliar repos
- [ ] Add supply-chain check script

## 8. Additional config

- [x] Add Husky
- [x] Add lint-staged config
- [x] Add `.husky/pre-commit` running lint-staged
- [ ] Decide whether `type-check` belongs in pre-commit or stays CI-only
- [x] Set `strict: true` in `tsconfig.json`
- [x] Set `noEmit: true` in `tsconfig.json`
- [x] Set `allowJs: false` in `tsconfig.json`
- [x] Add `.gitattributes` to force LF line endings
- [x] Add `.vscode/settings.json` (Prettier on save, ESLint fix on save, workspace TS version)
- [x] Add `.vscode/extensions.json` recommending Prettier, ESLint, Tailwind
- [ ] Document commit message convention
- [ ] Document branch naming convention (`type/kebab-description`, types mirror commit types)
- [ ] Add `CONTRIBUTING.md` with branch, commit, and PR rules
- [ ] Add commitlint
- [ ] Add branch name check to CI or a git hook

## 9. Folder structure

Decided: **feature-first**. Reasoning in
[docs/folder-structure.md](docs/folder-structure.md), shareable summary in
[docs/folder-structure-options.md](docs/folder-structure-options.md).

- [x] Create `src/features/` — one folder per domain
- [x] Create `src/components/ui/` (shadcn) and `src/components/shared/`
- [x] Create `src/lib/supabase/`
- [x] Create `src/hooks/` for cross-feature hooks only
- [x] Create `src/types/`
- [x] Document the required feature shape in `src/features/README.md`
- [x] No `helpers/`, no `utils/`, no `data/` at top level — one home per concept
- [x] Add Zod
- [x] Add a reference feature — was `contact/`, replaced by `users/` (full
      CRUD against a real table) once the database existed
- [ ] Add route groups `(marketing)` and `(app)` once there are real pages
- [x] Enforce with `eslint-plugin-boundaries`, deny-by-default
- [x] Rule: features never import other features
- [x] Rule: only server/ may import lib/supabase
- [x] No barrel files — direct imports (see src/features/README.md)
- [ ] Document naming conventions (kebab-case dirs, PascalCase components)
- [x] Close fail-open holes: no-unknown-files, no-unknown-dependencies, external SDK
- [x] Add `test:boundaries` canary proving the rules actually fire
- [x] Run `test:boundaries` in CI only. It was in pre-push until CI existed;
      that duplicated a slower, skippable copy of the same check, and two
      concurrent pushes raced on the canary's temp files and broke a real push.
- [x] Run `test:boundaries` in CI — pre-push is bypassable with `--no-verify`
- [x] Classify `src/proxy.ts` via `boundaries/files`
- [ ] Add path-casing check to CI
- [ ] Rewrite guard rails doc Section 9 to match

- [x] Warn loudly when Supabase is unconfigured in production — silent session
      refresh failure looks like users being signed out at random
- [x] Require a reason on every `eslint-disable`, so silencing a rule is
      visible in review instead of accumulating
- [ ] Move to the scoped `@boundaries/eslint-plugin`. Not yet: on 2026-08-04
      both names publish 7.1.0 two seconds apart and the old name carries no
      `deprecated` field, so the rename fixes nothing today. Do it when the
      versions diverge — one import line, no config change.

Declined: consolidating the boundaries taxonomy (16 types → ~9). Every type
names a real folder, so merging only makes the error messages vaguer. Revisit
if adding a folder starts to feel heavy.

## 10. BugBot

- [ ] Add `.cursor/BUGBOT.md` with focus areas and ignore rules
- [ ] Connect GitHub org to Cursor dashboard
- [ ] Enable BugBot for the repository
- [ ] Add Cursor Bugbot as a required status check

## 11. AI context files

Decided: **Claude Code only.** One agent file, no cross-tool pointers. Skills,
subagents and hooks are Claude-specific and have no equivalent elsewhere, so
supporting a second tool would only ever cover half of this. If another tool is
adopted, give it a pointer to `CLAUDE.md` rather than a copy.

- [x] Write `CLAUDE.md` with stack and versions
- [x] `CLAUDE.md`: quality gate commands
- [x] `CLAUDE.md`: do-not-touch areas
- [x] `CLAUDE.md`: structure rules, pointing at `src/features/README.md`
- [ ] `CLAUDE.md`: naming conventions — not written down anywhere yet
- [ ] `CLAUDE.md`: product knowledge section, per project
- [ ] Add `.claude/settings.json`
- [ ] Decide sync mechanism for `.claude/` across repos
- [ ] Verify an agent actually follows it — give Claude a task that tempts it
      into a violation and see whether it self-corrects
- [ ] `.cursor/BUGBOT.md` if section 10 goes ahead — BugBot is Cursor-based

## 11a. Claude skills

- [ ] Decide which skills the boilerplate ships with
- [ ] Skill: PR review
- [ ] Skill: frontend review
- [ ] Skill: backend review
- [ ] Skill: database review
- [ ] Skill: code style review
- [ ] Skill: security review
- [ ] Skill: new API route scaffold
- [ ] Skill: new DB call scaffold
- [ ] Skill: new migration
- [ ] Skill: new component scaffold
- [ ] Document how to add a project-specific skill

## 11b. Agent enforcement

- [ ] Add hooks to enforce conventions at write time
- [ ] Hook: block writes outside the agreed folder layout
- [ ] Hook: run lint/format after file writes
- [ ] Hook: block edits to do-not-touch paths (migrations, env files)
- [ ] Hook: run type-check before commit
- [ ] Document hook setup in `.claude/settings.json`

## 11c. Subagents

- [ ] Decide which subagents ship with the boilerplate
- [ ] Subagent: code reviewer
- [ ] Subagent: security reviewer
- [ ] Subagent: migration writer
- [ ] Subagent: test writer
- [ ] Document how to add a project-specific subagent

## 11d. MCP servers

- [ ] Add `.mcp.json` for project-scoped servers
- [ ] Configure Supabase MCP server
- [ ] Configure Figma MCP server
- [ ] Configure Playwright/browser MCP server
- [ ] Document MCP auth setup without committing tokens
- [ ] Document which MCP servers are optional per project

## 12. Foundation repo

- [ ] README: what bunyaad is and how to start a project from it
- [ ] README: post-clone checklist
- [ ] Add `SETUP.md` per-project checklist
- [ ] Document the sync problem and current answer
- [ ] Add repo health audit script or checklist

## 13. Active security testing

- [ ] Add CodeQL to CI
- [ ] Add Snyk to CI
- [ ] Add TruffleHog to CI
- [ ] Add GitGuardian to CI
- [ ] Add secret scanner script
- [ ] Document OWASP ZAP run against staging
- [ ] Document Burp Suite IDOR test matrix
- [ ] Document security testing cadence
- [ ] Document `git log -S` secret pattern checks

## 14. Safe deployment

- [ ] Document canary/preview-then-promote workflow
- [ ] Add feature flag setup (FlagSmith or Supabase table)
- [ ] Add `feature_flags` table migration
- [ ] Document rollout sequence (internal → beta → 10% → 100%)
- [ ] Document rollback procedure
- [ ] Add automated promote/rollback workflow
- [ ] Document post-deploy monitoring window

## 15. Observability

- [ ] Add Sentry via wizard
- [ ] Add `sentry.client.config.ts`
- [ ] Add `sentry.server.config.ts`
- [ ] Add `sentry.edge.config.ts`
- [ ] Add `Sentry.setUser()` in auth flow
- [ ] Add `components/ErrorBoundary.tsx`
- [ ] Wrap root layout in ErrorBoundary
- [ ] Document Sentry alert rules
- [ ] Configure Sentry data scrubbing for PII
- [ ] Add Pino + `lib/logger.ts`
- [ ] Document log levels and `LOG_LEVEL` per environment
- [ ] Document what never to log
- [ ] Ban `console.log` in server code via lint rule

## 16. Legal

- [ ] Add `/privacy` route stub
- [ ] Add `/terms` route stub
- [ ] Add footer links to privacy and terms
- [ ] Add cookie consent banner
- [ ] Add "Delete my account" flow
- [ ] Document ICO registration check
- [ ] Document third-party services to list in privacy policy
- [ ] Add legal checklist to per-project setup

## 17. Mobile-first

- [ ] Add `overflow-x-hidden` to `<body>`
- [ ] Use `min-h-dvh` in layouts
- [ ] Document 44x44px minimum touch target rule
- [ ] Document no hover-only interactions rule
- [ ] Document mobile-first Tailwind breakpoint order
- [ ] Document form input rules (16px minimum, type, autocomplete)
- [ ] Document real-device testing requirement
- [ ] Add base input component meeting mobile rules

## 18. Runtime security

- [ ] Document RLS-on-all-tables requirement
- [ ] Document sensitive data table separation
- [ ] Document `NEXT_PUBLIC_` prefix rules
- [ ] Add Zod validation pattern for API route inputs
- [ ] Configure CORS in `next.config.ts`
- [ ] Add rate limiting to API routes
- [ ] Add generic API error response helper
- [ ] Add security headers (CSP, X-Frame-Options)

## 19. Sensitive data exposure

- [ ] Document no-sensitive-data-in-URLs rule
- [ ] Add sessionStorage token pattern helper
- [ ] Document base64-is-not-encryption
- [ ] Document localStorage storage policy
- [ ] Document error message exposure rules

## 20. UI

- [ ] Init shadcn/ui and `components.json`
- [ ] Add base shadcn components
- [ ] Set up Tailwind v4 theme tokens in `globals.css`
- [ ] Add dark mode support
- [ ] Add fonts setup
- [ ] Document which components are shared vs feature-owned

## 20a. SEO

- [ ] Add metadata pattern per route (title, description, canonical)
- [ ] Add Open Graph and Twitter card defaults
- [ ] Add `sitemap.ts` and `robots.ts`
- [ ] Add JSON-LD structured data helper
- [ ] Add per-page metadata to the reference feature
- [ ] Document SEO rules for marketing vs app surfaces

## 20b. Knowledge base and content

- [ ] Decide content source (MDX in repo vs Supabase vs CMS)
- [ ] Add folder structure for articles and categories
- [ ] Add a worked example article
- [ ] Add search over content
- [ ] Add SEO metadata generated per article

## 20c. Internationalisation

- [ ] Decide whether i18n ships by default or per project
- [ ] Choose the library (next-intl vs alternatives)
- [ ] Add locale routing pattern
- [ ] Add translation file structure and naming
- [ ] Document the rule: no hardcoded user-facing strings

## 21. Data layer

- [ ] Decide: Supabase client only, or Prisma alongside it
- [ ] Add `lib/dbCalls/[entity]/` pattern — all queries live here
- [ ] Rule: no Supabase calls directly from components
- [ ] Add typed query result helpers
- [ ] Add DB error handling wrapper
- [ ] Document RLS-first query approach
- [ ] Add seed script for local dev
- [ ] Document migration naming convention
- [ ] Add Postgres function (RPC) pattern and example
- [ ] Rule: RPC for atomic or multi-table transactions, dbCalls for everything else
- [ ] Add typed wrapper for `supabase.rpc()` calls
- [ ] Document how RPC functions are reviewed and migrated

## 21a. Storage and background jobs

- [ ] Add Supabase Storage bucket setup
- [ ] Add upload/download helpers
- [ ] Add storage RLS policies
- [ ] Add file type and size validation
- [ ] Add signed URL pattern for private files
- [ ] Decide background job approach (Vercel Cron vs Supabase Edge Functions)
- [ ] Add scheduled job example
- [ ] Add long-running task pattern
- [ ] Document what belongs in a job vs a request

## 22. API layer

- [ ] Add API route folder convention
- [ ] Add Zod request validation helper
- [ ] Add standard success/error response shape
- [ ] Add auth guard helper for protected routes
- [ ] Add ownership check helper (guard against IDOR)
- [ ] Add rate limit helper
- [ ] Add example API route showing the full pattern
- [ ] Document when to use route handler vs server action

## 23. Authentication

Decided: two roles (`admin`/`member`), default member, admins promote via the
app, no self-change, never demote the last admin. First admin: seeded locally,
one dashboard flip in production. OAuth/teams/invitations/MFA deliberately out
until a client project needs them.

- [x] Add Supabase Auth setup
- [x] Add sign up / sign in / sign out flows
- [x] Add password reset flow (email lands in Mailpit locally, :54324)
- [x] Add email link handling — `/auth/confirm` verifies and forwards
- [ ] Add OAuth provider example — deliberately deferred
- [x] Add protected route pattern — `requireAdminPage()` redirect guard
- [x] Add role checking helpers — `requireUser` / `requireRole` in lib/supabase
- [x] Add `profiles` table — trigger-created from auth.users, real RLS
      policies, demo policies gone
- [ ] Separate sensitive user data into its own RLS-protected table — when
      there is sensitive data to separate
- [x] Add session handling in server components — `getSessionUser()`
- [ ] Document auth redirect URL config per environment (needed at deploy)
- [ ] Test the full flows in the browser after `db:reset` regenerates
      everything (sign in as both roles, promote, demote, last-admin rule)

## 24. Error handling

- [ ] Add global error boundary
- [ ] Add `app/error.tsx` and `app/not-found.tsx`
- [ ] Add typed Result/error pattern for helpers
- [ ] Add central error classes
- [ ] Rule: generic errors to client, full detail to Sentry
- [ ] Add loading and empty state conventions
- [ ] Document error handling rules in CLAUDE.md

## 25. Multi-domain setup

- [ ] Decide: single app with subdomain routing, or separate repos
- [ ] Add marketing site on root domain
- [ ] Add app on `app.` subdomain
- [ ] Add subdomain routing in middleware
- [ ] Document Vercel domain and env config per surface
- [ ] Document auth cookie domain sharing across subdomains
- [ ] Add SEO setup for marketing surface only

## 26. Build fast with AI

- [ ] Write the AI workflow guide: how to build a feature end to end
- [ ] Document the prompt-to-PR loop
- [ ] Document self-verification commands for agents
- [ ] Add scaffolding commands for common tasks
- [ ] Document what agents must never do in this repo
- [ ] Add a worked example feature in the repo

## 26a. AI team (gstack)

- [ ] Study gstack structure and pick what applies
- [ ] Decide: vendor gstack wholesale, or adapt its roles to AppSphere conventions
- [ ] Adapt roles so they know `dbCalls/`, RLS, and the migration workflow
- [ ] Role: product/CEO review before build
- [ ] Role: architecture lock before implementation
- [ ] Role: design review to catch AI slop
- [ ] Role: code reviewer for production bugs
- [ ] Role: QA against a real browser
- [ ] Role: security officer (OWASP/STRIDE)
- [ ] Role: release engineer to ship the PR
- [ ] Add slash commands for each role
- [ ] Document the end-to-end role sequence for a feature
- [ ] Keep roles in sync with `CLAUDE.md` conventions

## 27. Open decisions

- [ ] Prisma or Supabase client only
- [ ] Single repo with subdomains, or split marketing and app
- [ ] Which Claude skills ship by default
- [ ] Which subagents ship by default
- [ ] How skills files sync to existing repos
- [ ] Sentry now or per project
- [ ] Feature flags now or per project
- [ ] Vendor gstack agents or adapt our own
- [ ] Background jobs: Vercel Cron or Supabase Edge Functions
- [ ] Redis cache: skip for now or add alongside rate limiting

## 28. Deferred — revisit after building something real

Researched, proven, deliberately not doing yet. Full detail in
[docs/ai-code-quality.md](docs/ai-code-quality.md).

**Why deferred:** the repo is a hello-world page. These rules would be aimed at
imagined code, not code we have watched an agent get wrong. Build a real
feature first, see what actually breaks, then add the guardrail that catches it.

### Oxlint as a second, faster linter

Add when the write-time hook exists and ESLint's delay is actually annoying.

- [ ] Add `oxlint` + `oxlint-tsgolint` + `eslint-plugin-oxlint` (pin all three in step)
- [ ] Add `.oxlintrc.json` with `--type-aware` enabled
- [ ] Turn off `react/react-in-jsx-scope` — false positive on every JSX file
- [ ] Wire into ESLint via `oxlint.buildFromOxlintConfigFile('.oxlintrc.json')`, last in the config
- [ ] Use default import, not named — the package is CJS and named imports crash ESLint
- [ ] Add `lint:quick` script
- [ ] Add ADR recording why two linters
- [ ] Add README table: which linter runs when

**Reason to do it:** ESLint takes ~8s even on an empty project, because config
loading dominates. Too slow to run after every agent file write. Oxlint
type-aware is ~2.4s warm. Spike proved the two work together on Next.js — a
combination with no precedent on GitHub — and the dedup keeps the Next.js and
a11y rules while handing `no-unused-vars`, `no-explicit-any` and floating
promises to Oxlint.

**Reason to wait:** it only pays off once the PostToolUse hook exists. Without
the hook there is no write-time loop to speed up, and it is just a second config
to maintain. Note the dedup does **not** make ESLint faster — it only stops
double-reporting.

### Also deferred

- [ ] Type-aware ESLint (`projectService: true`) — big win, big slowdown
- [ ] `eslint-plugin-boundaries` — needs the folder structure to exist first
- [ ] `naming-convention` rules — tune against real code, not guesses
- [ ] Complexity caps (`complexity: 10`, `max-lines-per-function`) — numbers are guesses until we measure
- [ ] `unicorn/prevent-abbreviations` — needs ESLint 10, and is noisy

### Plugins found in research, not adopted

- [ ] `eslint-plugin-ai-guard` — built for exactly our problem (floating promises,
      empty catch blocks, hardcoded secrets, SQL injection in AI-written code).
      Only ~3.5k downloads/month, so too immature for a template every client
      repo inherits. Recheck adoption later.
- [x] `@eslint-community/eslint-comments` — adopted for `require-description`
      and `no-unlimited-disable`. `no-restricted-disable` is still unused: it
      pins specific rules as unsilenceable, which needs real evidence of which
      rules get silenced first.
- [ ] `eslint-plugin-no-secrets` — overlaps with the CI secret scanner already
      planned in section 13.
- [ ] `eslint-plugin-security`, `SonarJS` — evaluate against real code.
- [ ] `no-restricted-syntax` to ban enums, `else` chains, hardcoded routes —
      opinionated; revisit once conventions are settled.
