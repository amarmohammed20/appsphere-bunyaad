# Bunyaad TODO

Every candidate item for the boilerplate. Tick what we do; strike or delete what we decide against.
Source: App Build Guard Rails.

## 1. GitHub repo settings

- [ ] Enable branch protection on `main`
- [ ] Require a pull request before merging
- [ ] Require at least 1 approving review
- [ ] Dismiss stale reviews when new commits are pushed
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Block direct pushes to `main`
- [ ] Disallow bypassing branch protection settings
- [ ] Enable auto-delete head branches
- [ ] Enable "Template repository" so new projects use "Use this template"

## 2. PR template

- [ ] Add `.github/pull_request_template.md`
- [ ] Include what/why/type-of-change sections
- [ ] Include testing and screenshot sections
- [ ] Include checklist: lint rules, tests, docs, branch up to date

## 3. pnpm setup

- [ ] Pin pnpm version in `package.json` via Corepack
- [ ] Add `preinstall: npx only-allow pnpm`
- [ ] Document npm-to-pnpm command mapping in README

## 4. ESLint and Prettier

- [ ] Add `@typescript-eslint` plugin and parser
- [ ] Add `eslint-plugin-react` and `eslint-plugin-react-hooks`
- [ ] Add `eslint-plugin-import`
- [ ] Add Prettier + `eslint-config-prettier` + `eslint-plugin-prettier`
- [ ] Add `.prettierrc`
- [ ] Add `.prettierignore`
- [ ] Rule: `@typescript-eslint/no-unused-vars` with `^_` ignore pattern
- [ ] Rule: `@typescript-eslint/no-explicit-any` as warn
- [ ] Rule: `@typescript-eslint/consistent-type-imports` as error
- [ ] Rule: `import/order` with grouping, newlines, alphabetise
- [ ] Add `type-check` script
- [ ] Add `lint` and `lint:fix` scripts
- [ ] Add `format` script

## 5. Environments and Supabase

- [ ] Run `supabase init` and commit `config.toml`
- [ ] Create `supabase/migrations/` folder
- [ ] Add `lib/supabase/client.ts`
- [ ] Add `lib/supabase/server.ts`
- [ ] Add `lib/supabase/middleware.ts`
- [ ] Add `middleware.ts` for session refresh
- [ ] Add `src/@types/database.types.ts` placeholder
- [ ] Add script to generate Supabase types
- [ ] Add DB scripts: start, stop, reset, diff, push, pull
- [ ] Add `.env.example` with all required keys
- [ ] Document three-environment setup (local, staging, production)
- [ ] Document migration promotion workflow (local → staging → production)
- [ ] Create staging and production Supabase projects
- [ ] Set Vercel environment variables per tier

## 6. GitHub Actions CI

- [ ] Add `.github/workflows/ci.yml`
- [ ] CI job: lint
- [ ] CI job: type-check
- [ ] CI job: build
- [ ] Use `pnpm install --frozen-lockfile` in CI
- [ ] Cache pnpm store in CI
- [ ] Convert workflows to reusable (`workflow_call`) for client repos
- [ ] Tag reusable workflows with `v1` for consumers
- [ ] Document how client repos reference the reusable workflows
- [ ] Add PR DB migrations pipeline
- [ ] Add migration file naming/format check
- [ ] Add check for unpushed migration candidates
- [ ] Add PR policy workflow (title, labels, size)
- [ ] Add Slack notification workflow
- [ ] Add scheduled security workflow

## 7. Supply chain security

- [ ] Add `minimumReleaseAge` to `pnpm-workspace.yaml`
- [ ] Add `blockExoticSubdeps` to `pnpm-workspace.yaml`
- [ ] Add `trustPolicy: no-downgrade` to `pnpm-workspace.yaml`
- [x] Add `allowBuilds` allowlist to `pnpm-workspace.yaml`
- [ ] Add `.npmrc` with `save-exact=true`
- [ ] Add `.npmrc` with `registry=https://registry.npmjs.org/`
- [ ] Add Socket Firewall to CI
- [ ] Document Socket Firewall install on dev machines
- [ ] Document `pnpm store prune` after installing a scanner
- [ ] Document lockfile rules (never gitignore, review diffs)
- [ ] Document upgrade habits (one at a time, changelog, audit)
- [ ] Document dependency minimisation policy
- [ ] Document `.vscode/tasks.json` inspection before opening unfamiliar repos
- [ ] Add supply-chain check script

## 8. Additional config

- [ ] Add Husky
- [ ] Add lint-staged config
- [ ] Add `.husky/pre-commit` running lint-staged
- [ ] Set `strict: true` in `tsconfig.json`
- [ ] Set `noEmit: true` in `tsconfig.json`
- [ ] Set `allowJs: false` in `tsconfig.json`
- [ ] Document commit message convention
- [ ] Document branch naming convention (`type/kebab-description`, types mirror commit types)
- [ ] Add `CONTRIBUTING.md` with branch, commit, and PR rules
- [ ] Add commitlint
- [ ] Add branch name check to CI or a git hook

## 9. Folder structure

- [ ] Create `src/components/` with domain subfolder pattern
- [ ] Create `src/components/shared/`
- [ ] Create `src/data/` for static copy and config
- [ ] Create `src/helpers/` for pure functions
- [ ] Create `src/lib/` for integrations
- [ ] Create `src/schemas/` for Zod schemas
- [ ] Create `src/types/models/`
- [ ] Add Zod
- [ ] Document layer responsibilities (what goes where, what never does)
- [ ] Document naming conventions (kebab-case dirs, file casing)
- [ ] Document barrel file policy
- [ ] Document structure anti-patterns
- [ ] Add path-casing check to CI

## 10. BugBot

- [ ] Add `.cursor/BUGBOT.md` with focus areas and ignore rules
- [ ] Connect GitHub org to Cursor dashboard
- [ ] Enable BugBot for the repository
- [ ] Add Cursor Bugbot as a required status check

## 11. AI context files

- [ ] Write `AGENTS.md` with stack and versions
- [ ] `AGENTS.md`: domain and folder map
- [ ] `AGENTS.md`: naming conventions
- [ ] `AGENTS.md`: quality gate commands
- [ ] `AGENTS.md`: do-not-touch areas
- [ ] `AGENTS.md`: domain-specific rules section
- [ ] `AGENTS.md`: product knowledge section
- [ ] Add `CLAUDE.md`
- [ ] Add `.claude/settings.json`
- [ ] Add `.cursor/rules/`
- [ ] Add `.agents/skills/` review skills
- [ ] Decide sync mechanism for skills files across repos
- [ ] Make one source of truth for agent rules, with thin pointers for each tool
- [ ] Verify setup works in Claude Code
- [ ] Verify setup works in Cursor
- [ ] Verify setup works in Codex
- [ ] Document which file each tool reads

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

- [ ] Add Supabase Auth setup
- [ ] Add sign up / sign in / sign out flows
- [ ] Add password reset flow
- [ ] Add email confirmation handling
- [ ] Add OAuth provider example
- [ ] Add protected route pattern via middleware
- [ ] Add role/permission checking helper
- [ ] Add `profiles` table migration
- [ ] Separate sensitive user data into its own RLS-protected table
- [ ] Add session handling in server components
- [ ] Document auth redirect URL config per environment

## 24. Error handling

- [ ] Add global error boundary
- [ ] Add `app/error.tsx` and `app/not-found.tsx`
- [ ] Add typed Result/error pattern for helpers
- [ ] Add central error classes
- [ ] Rule: generic errors to client, full detail to Sentry
- [ ] Add loading and empty state conventions
- [ ] Document error handling rules in AGENTS.md

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
- [ ] Keep roles in sync with `AGENTS.md` conventions

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
