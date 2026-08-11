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
- [x] Add `lib/supabase/hardenSessionCookie.ts` — `HttpOnly` on the session cookies.
      Replaced `lib/supabase/client.ts`, which was never imported; see 18a.
- [x] Add `lib/supabase/createSupabaseClient.ts`
- [x] Add `lib/supabase/refreshSession.ts` (was `proxy.ts` — renamed so it does
      not collide with the Next convention file `src/proxy.ts`)
- [x] Add `lib/supabase/README.md` answering "why more than one client?"
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
- [ ] Behavioural test that `authenticated` cannot execute `is_admin()`, in
      verify-reset-db.mjs. The diff tool dropped that revoke and only a human
      reading the migration caught it — see docs/supabase-diff-caveats.md
- [x] CI check: schema files must match migrations (`pnpm check:schema-matches-migrations`,
      job `db-checks / Schema matches migrations`). Proved by adding a policy to the schema
      without diffing and watching it go red. Previously every gate keyed off
      changed migration files, so an undiffed schema edit fast-passed.
- [ ] Make `db-checks / Schema matches migrations` a required status check alongside
      `db-checks / Verify`
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
[docs/folder-structure.md](docs/folder-structure.md).

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
- [x] Document naming conventions — CLAUDE.md "Naming"
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
- [x] `CLAUDE.md`: naming conventions — file named after its export, named
      exports only, no adjective repeating the folder
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

- [x] Add Sentry — manually, not via the wizard: it rewrites next.config.ts,
      which holds the security headers. See docs/sentry-setup.md
- [x] Add `instrumentation-client.ts` — replaces the old sentry.client.config.ts
- [x] Add `sentry.server.config.ts` + `instrumentation.ts` with onRequestError
- [x] Add `sentry.edge.config.ts` — proxy.ts runs in this runtime
- [x] Add `Sentry.setUser()` in getSessionUser — id and role only, never email
- [x] Error boundaries are the Next file conventions, not a component:
      app/error.tsx and app/global-error.tsx
- [x] global-error.tsx covers the root layout — it replaces it, so it brings
      its own html/body and stylesheet
- [ ] Document Sentry alert rules
- [x] Configure Sentry PII scrubbing — sendDefaultPii false, sendClientReports
      false, beforeSend strips Authorization/Cookie and drops NEXT_NOT_FOUND
- [ ] Add Pino + `lib/logger.ts` — deliberately deferred. Sentry captures
      errors; a second logging library earns its place when there are
      structured server logs worth shipping
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
- [x] 44px minimum touch target — enforced in the components, not documented:
      button/input/select default to h-11. See src/components/ui/README.md
- [ ] Document no hover-only interactions rule
- [ ] Document mobile-first Tailwind breakpoint order
- [ ] Document form input rules (16px minimum, type, autocomplete)
- [ ] Document real-device testing requirement
- [x] Add base input component meeting mobile rules — h-11, `text-base md:text-sm`
      so iOS does not zoom on focus

## 18. Runtime security

- [ ] Document RLS-on-all-tables requirement
- [ ] Document sensitive data table separation
- [ ] Document `NEXT_PUBLIC_` prefix rules
- [ ] Add Zod validation pattern for API route inputs
- [ ] Configure CORS in `next.config.ts`
- [ ] Add rate limiting to API routes
- [ ] Add generic API error response helper
- [x] Add security headers — `next.config.ts` sets `X-Content-Type-Options`,
      `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS
- [ ] Add Content-Security-Policy. Deliberately not done with the headers above:
      a useful CSP needs a per-request nonce, which means generating one in
      `src/proxy.ts` and putting it on the request headers so Next can stamp its
      own inline scripts. A constant CSP would need `'unsafe-inline'`, which
      permits exactly the injection it claims to stop. Its own change, verified
      in a browser.

### 18a. Close the XSS session-theft vector

Who can read the auth cookies, and whether we can stop them:

| Attack                    | How                                          | Stoppable?                |
| ------------------------- | -------------------------------------------- | ------------------------- |
| XSS                       | injected JS reads `document.cookie`          | **Yes — this is the one** |
| Malicious npm package     | ships into the bundle, then behaves like XSS | Partly                    |
| Browser extension         | reads cookies via extension APIs             | No                        |
| Malware on the machine    | reads the browser's cookie file from disk    | No                        |
| Network sniffing          | intercepts the request                       | Yes — HTTPS               |
| Physical access, unlocked | opens devtools                               | No                        |

Extensions and malware run at higher privilege than the page. There is no code
that detects or blocks them — the controls are policy (extension allowlist),
not application code. That is exactly why short expiry and refresh rotation
exist: theft is partly unpreventable, so the damage is capped instead.

Already covering this: no XSS injection points (zero `dangerouslySetInnerHTML`,
`innerHTML`, `eval`); supply-chain hardening (`minimumReleaseAge`,
`blockExoticSubdeps`, exact pinning, CI secret scan); 1h token expiry with
rotation; RLS, so even a valid stolen token only returns that user's rows.

Done:

- [x] Set auth cookies `HttpOnly` via `lib/supabase/hardenSessionCookie.ts`. The
      browser now refuses to expose them to JavaScript — `document.cookie`
      returns nothing and XSS cannot steal a session.
- [x] Deleted `lib/supabase/client.ts`. It was never imported, and keeping it
      would have meant keeping the cookies JS-readable for code that did not
      exist. A project needing Realtime or direct Storage uploads reintroduces
      it deliberately, dropping `HttpOnly` as a recorded decision.
- [x] Copy the `headers` argument of `setAll` onto the response in
      `refreshSession.ts` — `Cache-Control: no-store` and friends. Without it a
      CDN may cache a response carrying one user's `Set-Cookie` and replay it to
      another. The SDK has passed these since @supabase/ssr added the argument;
      we were dropping them.

Still open:

- [ ] Verify in a browser after `db:reset`: sign in, then confirm
      `document.cookie` in devtools shows no `sb-*` entry while the session
      still works. Blocked on Docker being up.
- [ ] Add a lint rule or canary that fails if `createBrowserClient` is
      reintroduced without also removing `hardenSessionCookie` — right now the two
      decisions are only linked by prose.

## 19. Sensitive data exposure

- [ ] Document no-sensitive-data-in-URLs rule
- [ ] Add sessionStorage token pattern helper
- [ ] Document base64-is-not-encryption
- [ ] Document localStorage storage policy
- [ ] Document error message exposure rules

## 20. UI

- [x] Colours come from semantic tokens, never raw palette classes. Enforced by
      `pnpm check:colours`, which runs in CI before install. The migration that
      introduced this rule missed four occurrences, which is why it is a command
      and not a paragraph.

- [x] Init shadcn/ui and `components.json` — Radix base, Nova preset, Tailwind v4
- [x] Add base shadcn components — only what is used; see src/components/ui/README.md
- [x] Set up Tailwind v4 theme tokens in `globals.css` — OKLCH, `@theme inline`
- [x] Add dark mode support — next-themes, class-based, defaults to system
- [x] Add fonts setup — Geist wired to `--font-sans`
- [x] Document which components are shared vs feature-owned — src/features/README.md

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

Declined: **wrapping the Supabase SDK in a generic `Database` interface** so the
app could survive a move off Supabase. Recorded here because it sounds prudent
and will be re-proposed otherwise.

- The security model cannot be wrapped. RLS policies, `auth.uid()`, the
  `security definer` functions and the `protect_last_admin` trigger live in
  Postgres and are enforced there. An application-layer interface cannot move
  them, so the part most worth protecting is the part least able to be.
- The abstraction leaks immediately. Refresh-token rotation, `getUser()`'s
  network round trip, PKCE, cookie chunking — no vendor-neutral interface has
  these, so its methods end up named after Supabase's anyway.
- It does not pay off on the day it is meant to. Leaving Supabase means writing
  session issuance, refresh rotation and email verification from scratch: a new
  subsystem, not a swap behind an interface.

What actually limits the blast radius is already in place: Supabase appears in
`src/features/` at roughly 15 call sites, all inside `server/`, and a boundaries
rule stops anything else importing the SDK. Changing 15 known places is cheaper
than maintaining an indirection for years.

Related naming rule (kept): vendor names only at the vendor boundary — see
CLAUDE.md "Vendor names". `lib/supabase/auth.ts` moved to `lib/auth/session.ts`
under that rule, with a new `lib-auth` boundaries element so it stays reachable
only from `server/` and cannot be laundered to a Client Component via `lib`.

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
- [x] Add role checking helpers — `requireUser` / `requireAdmin` in lib/auth.
      `requireRole(role)` was dropped: with two roles it only ever meant
      admin, and `requireRole('member')` would have rejected admins.
- [x] Add `profiles` table — trigger-created from auth.users, real RLS
      policies, demo policies gone
- [ ] Separate sensitive user data into its own RLS-protected table — when
      there is sensitive data to separate
- [x] Add session handling in server components — `getSessionUser()`
- [ ] Document auth redirect URL config per environment (needed at deploy)
- [x] Set session expiry — `inactivity_timeout = "720h"` (30 days). Without it
      a session never expires. See docs/how-auth-works.md section 5.
- [ ] Set the recovery email template in the hosted dashboard (Authentication >
      Email Templates > Reset Password) to match supabase/templates/recovery.html.
      Until then password reset is broken in production, exactly as it was
      locally — config.toml is local-only
- [ ] Set the same 30-day inactivity timeout in the hosted project's dashboard
      until `supabase config push` is wired up — config.toml is local-only
- [ ] Test the full flows in the browser after `db:reset` regenerates
      everything (sign in as both roles, promote, demote, last-admin rule)

### From the PR #9 external review (2026-08-05)

Fixed: last-admin rule moved into a DB trigger with an advisory lock (was
app-only and bypassable via REST); anon/authenticated over-grants revoked;
auth failures now logged in getSessionUser; profiles.email syncs on email
change; signup trigger idempotent; password minimum aligned at 8 both sides;
`//evil.com` open redirect closed via lib/toSafeReturnPath; confirm endpoint
accepts recovery tokens only; is_admin() no longer callable over RPC;
refresh-before-push removes the stale-page flash; check:rls now catches a
later `disable row level security`; seeded users have fixed ids; behavioural
RLS checks added to the smoke script; unused users API, env.server.ts and
the fields.tsx multi-export file removed.

Declined:

- `isSupabaseConfigured` stays `.some()` — with `.every()`, half-configured
  env silently runs unconfigured; with `.some()` it fails loudly at startup,
  which the file already documents as the intent.
- `toRole` still throws on an unknown role — corruption should stop the
  page, and adding a role is a deliberate two-file change; revisit as a
  Postgres enum when roles next change.
- PasswordStrength stays — bound to the real minimum now; above the minimum
  it is guidance by design.
- Shared form primitives stay in features/auth — components/shared is for
  code used by two or more features; auth is the only consumer today.

Deferred:

- [ ] Seed via supabase.auth.admin.createUser instead of raw auth.users
      inserts — survives GoTrue schema changes
- [ ] Hosted auth config under version control (`supabase config push`) and
      a CI assert that site_url is not localhost in production — the review
      is right that reset emails redirecting to 127.0.0.1 is the classic
      launch-day incident
- [ ] Replace the check:rls regex with a pg_class query against the rebuilt
      CI database — cannot be fooled; partitioned tables stop false-failing
- [ ] Map the profiles email-collision case in handle_new_user to a
      readable signup error

## 24. Error handling

- [x] Add global error boundary — app/global-error.tsx
- [x] Add `app/error.tsx` and `app/not-found.tsx` (Next 16 passes retry(), not
      reset() — anything using reset renders a dead button)
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
