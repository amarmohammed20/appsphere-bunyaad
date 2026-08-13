# Bunyaad

The AppSphere boilerplate. Every client project starts from a clone of this
repository.

Most code in our projects is AI-written. AI produces code that runs but is
often poor quality, and rules in a document get ignored. Bunyaad enforces
its rules mechanically — wrong code fails the build, not the review.

## Stack

Next.js 16 · React 19 · TypeScript 5.9 (strict) · Tailwind 4 · Supabase ·
Zod 4 · pnpm 11

UI: shadcn/ui with Radix primitives, dark mode via next-themes, Geist fonts.
Error reporting: Sentry (disabled without a DSN — safe on a fresh clone).

## Prerequisites

- **Node 22** — set by the workflows; any 22.x works locally.
- **pnpm** — `corepack enable` activates it. npm and yarn are blocked.
- **Docker** — required by the Supabase CLI for the local database.
- **Signed commits** — the pre-commit hook blocks unsigned commits.
  Run `scripts/security/setup-signed-commits.sh` or follow
  [docs/COMMIT-SIGNING-AND-SSH.md](docs/COMMIT-SIGNING-AND-SSH.md).

## Run it

```bash
pnpm install
pnpm dev
```

The app runs without a database. Supabase features stay off until you
configure one.

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Three variables, all public (inlined into the browser bundle):

| Variable                        | Source                                  | Required for      |
| ------------------------------- | --------------------------------------- | ----------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `supabase status` after `pnpm db:start` | Database features |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same                                    | Database features |
| `NEXT_PUBLIC_SENTRY_DSN`        | Sentry project settings                 | Error reporting   |

Blank values disable the feature, not the app. Half-configured Supabase
(one variable set, the other blank) fails loudly on purpose — see
[src/lib/env.ts](src/lib/env.ts).

## Local database

Start the local Supabase stack (requires Docker):

```bash
pnpm db:start
```

This gives you Postgres 17, Auth (GoTrue), Studio on `:54323`, and a local
email inbox on `:54324` for testing password resets. Copy the URL and anon
key from `supabase status` into `.env.local`.

The seed creates two accounts:

| Email                | Password      | Role   |
| -------------------- | ------------- | ------ |
| `admin@example.com`  | `password123` | admin  |
| `member@example.com` | `password123` | member |

Reset the database to replay all migrations and re-seed:

```bash
pnpm db:reset
```

### Migrations

Schema is declared in `supabase/schemas/*.sql`. To create a migration from
a schema change:

```bash
pnpm db:diff <migration-name>
```

Review the generated file — `supabase db diff` silently drops function
EXECUTE privileges and can invent grants. See
[docs/supabase-diff-caveats.md](docs/supabase-diff-caveats.md).

Push to the hosted project:

```bash
pnpm db:push        # apply
pnpm db:push:dry    # preview first
```

Regenerate TypeScript types after any schema change:

```bash
pnpm db:types
```

## Repository structure

```
src/
  app/              Next.js routing — pages, layouts, route handlers
  features/         One folder per business domain (see Architecture)
  components/
    ui/             shadcn primitives — generated, do not hand-edit for style
    shared/         Hand-written composites used across features
  lib/              Third-party wrappers and cross-cutting utilities
  hooks/            Shared React hooks
  types/            Generated database types and shared type definitions
  proxy.ts          Session refresh (runs before every request)
supabase/
  migrations/       Versioned SQL migrations
  schemas/          Declarative schema files (what migrations are generated from)
  seed.sql          Local development accounts
scripts/
  db/               Database validation and migration scripts
  security/         Security gate custom scripts
docs/               How-tos, explanations, reference docs
```

## Architecture

Code goes in `src/features/<domain>/`. Each domain follows a fixed folder
shape: `actions/`, `server/`, `components/`, `schemas/`, `data/`, `utils/`,
`hooks/`, `types.ts`. Create only the subfolders you need, but use the
standard names.

`src/features/users/` is the reference implementation — a full CRUD against
a real table. Copy its shape.

**[src/features/README.md](src/features/README.md) is the definitive
reference** for the folder structure, import rules, and where every kind of
code goes.

### Boundaries

Architecture rules are enforced by `eslint-plugin-boundaries`, configured
deny-by-default in [eslint.boundaries.mjs](eslint.boundaries.mjs). An
import is illegal unless a policy allows it, so breaking a rule fails the
build.

The rules you will hit:

- **Features never import other features.** Compose them in `app/`.
- **Only `server/` imports `lib/supabase/` or `lib/auth/`.** Components call
  actions, never queries.
- **No barrel files.** Import the file directly via the `@/` alias.
- **Supabase SDK imports are restricted** to `lib/supabase/` — domain code
  never touches the SDK.

`pnpm test:boundaries` proves the rules still catch violations by writing
deliberate bad imports and confirming each is rejected.

### Authentication

Built-in auth: email/password sign-up, sign-in, password reset, and
role-based access (`admin` / `member`).

- Session cookies are `HttpOnly` — no browser JavaScript can read them.
  There is no Supabase browser client.
- Session refresh happens in `src/proxy.ts` before rendering begins.
- `requireUser()` and `requireAdmin()` in `lib/auth/session.ts` gate
  server-side access.
- Row-level security on every table, enforced by CI (`pnpm check:rls`).
  A last-admin database trigger prevents removing the final admin.
- [docs/how-auth-works.md](docs/how-auth-works.md) covers the full
  request lifecycle.
- [src/lib/supabase/README.md](src/lib/supabase/README.md) explains why
  there are multiple server clients and why no browser client.

## Commands

| Command                                | Does                                                  |
| -------------------------------------- | ----------------------------------------------------- |
| `pnpm dev`                             | Development server                                    |
| `pnpm build`                           | Production build                                      |
| `pnpm lint`                            | ESLint, including architecture boundaries             |
| `pnpm lint:fix`                        | ESLint with auto-fix                                  |
| `pnpm type-check`                      | TypeScript, no emit                                   |
| `pnpm format`                          | Prettier, write                                       |
| `pnpm format:check`                    | Prettier, check only                                  |
| `pnpm check:colours`                   | Fails on raw palette classes outside `components/ui/` |
| `pnpm check:actions`                   | Fails if a GitHub Action is referenced by tag         |
| `pnpm check:supply-chain`              | Validates pnpm-workspace.yaml security policies       |
| `pnpm test:boundaries`                 | Proves architecture rules catch violations            |
| `pnpm db:start` / `db:stop`            | Start or stop local Supabase                          |
| `pnpm db:reset`                        | Replay all migrations and re-seed                     |
| `pnpm db:diff <name>`                  | Generate a migration from a schema change             |
| `pnpm db:push` / `db:push:dry`         | Push migrations to hosted project (or dry-run)        |
| `pnpm db:types`                        | Regenerate TypeScript types from the local schema     |
| `pnpm db:list`                         | Show migration status                                 |
| `pnpm check:rls`                       | Verify RLS is enabled on every table                  |
| `pnpm check:db-migrations`             | Validate migration alignment with hosted project      |
| `pnpm check:schema-matches-migrations` | Detect drift between schemas and migrations           |
| `pnpm verify:db-reset`                 | Post-reset smoke checks                               |

pnpm only — `npm install` and `yarn` are blocked by `preinstall`.

## Code quality

Every rule is an error. There are no warnings — warnings get ignored,
especially by AI agents.

- **ESLint** — strict TypeScript, no `any`, no bare `eslint-disable` (a
  reason is required), no import cycles, grouped import order. Architecture
  boundaries enforced.
- **Prettier** — single quotes, semicolons, trailing commas, 100-char lines,
  LF endings. Tailwind class sorting via plugin.
- **TypeScript** — strict mode, no loopholes.
- **Pre-commit hook** (Husky + lint-staged) — runs lint and format on staged
  files, checks for hardcoded secrets, validates build config integrity,
  enforces colour tokens, requires signed commits and an SSH remote.

Before finishing any piece of work:

```bash
pnpm lint && pnpm type-check && pnpm format:check && pnpm check:colours && pnpm build
```

## Design system

shadcn/ui components live in `src/components/ui/`. They are generated — do
not hand-edit for styling. Touch targets are raised to 44px minimum (button,
input, select) for mobile use. See
[src/components/ui/README.md](src/components/ui/README.md) for the
deliberate deviations from shadcn defaults.

Colours come from semantic tokens (`bg-primary`, `text-foreground`,
`border-border`), never raw palette classes (`bg-zinc-900`,
`text-red-500`). Re-theming for a client is six variables in
`globals.css` rather than a find-and-replace. `pnpm check:colours`
enforces this in CI and pre-commit.

[DESIGN.md](DESIGN.md) documents the design system — tokens, dark mode,
accessibility baseline, and the retheming steps for a client project.

## Error handling

Sentry on client, server, and edge runtimes. Disabled without a DSN — a
fresh clone runs cleanly.

When configured: PII is scrubbed, auth headers are redacted, query strings
are stripped, `NEXT_NOT_FOUND` errors are filtered, and user context is
limited to id and role. Error pages (`error.tsx`, `global-error.tsx`,
`not-found.tsx`) are designed and functional.

See [docs/sentry-setup.md](docs/sentry-setup.md) for per-project
configuration.

## CI pipelines

Three workflows, each a thin caller plus a reusable workflow. Fix once,
every repo inherits it. See
[docs/reusable-workflows.md](docs/reusable-workflows.md) for how to wire
a new repo and the security trade-offs of the `@v1` tag model.

### PR checks (`pr-checks / Verify`)

Runs on every pull request. In order: base branch merged, action pinning,
colour tokens, formatting, lint, types, architecture boundaries, build.

### Database checks (`db-checks / Verify` and `db-checks / Schema matches migrations`)

Runs when migration or schema files change. RLS enforcement, migration
alignment against the hosted project, full rebuild from scratch, dry-run
push, and a deliberate red gate that stays red until production has actually
been pushed.

### Security gate (`security-gate / Security Check`)

Runs on every PR and every push to main. Six layers — off-the-shelf tools
first, custom scripts for what the tools miss:

| Layer | What it checks                                                       |
| ----- | -------------------------------------------------------------------- |
| L1    | Build config integrity (the attack this repo's predecessor suffered) |
| L2    | Secrets — Gitleaks, TruffleHog, 13 custom patterns                   |
| L3    | Supply chain — pnpm policy, lockfile, registry, `pnpm audit`         |
| L4    | CI/CD integrity — ShellCheck, actionlint, zizmor, checkov            |
| L5    | SAST — Semgrep (10 rule packs) + custom SQL/XSS checks               |
| L6    | Container and config — Trivy filesystem + config scanning            |

See [docs/security-pipeline.md](docs/security-pipeline.md) for the full
map of tools vs custom scripts and why each custom script still exists.

## Dependency management

- **pnpm 11** with Corepack. Version pinned in `package.json`.
- **Exact versions** — `saveExact: true` in `pnpm-workspace.yaml`. No
  caret ranges.
- **3-day quarantine** — new package versions must be public for three days
  before pnpm will install them.
- **Exotic subdeps blocked** — no git URLs or raw tarballs in the
  dependency tree.
- **Build script allowlist** — only four packages may run install scripts.
  All others blocked by `pnpm-workspace.yaml`.
- **Registry locked** to `registry.npmjs.org` via `.npmrc`.
- **Renovate** — automated dependency update PRs. Grouped patches, dashboard
  approval for majors, no automerge, Monday schedule. Requires the Renovate
  GitHub App to be installed on the repo.
- **Security overrides** — bounded version ranges for known-vulnerable
  transitive dependencies in `pnpm-workspace.yaml`.
- **Actions pinned by commit SHA**, containers by digest. Enforced by
  `pnpm check:actions`.

## Security headers

`next.config.ts` sets response headers on all routes: `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Strict-Transport-Security` (2-year HSTS),
`Referrer-Policy`, and `Permissions-Policy` denying camera, microphone,
and geolocation.

## Git setup

- **Signed commits required.** The pre-commit hook blocks unsigned commits.
  Run `setup-signed-commits.sh` or follow
  [docs/COMMIT-SIGNING-AND-SSH.md](docs/COMMIT-SIGNING-AND-SSH.md).
- **SSH remote required.** HTTPS origins are blocked by the pre-commit hook.
- **CODEOWNERS** — security-critical files (build configs, workflows,
  security scripts, auth boundary, database) require review from designated
  owners. Inert until "Require review from Code Owners" is enabled in
  repo settings.

## Start a project from it

1. **Use this template** on GitHub, or clone and re-point the remote.
2. Copy `.env.example` to `.env.local` and fill it in.
3. Update `name` in `package.json`.
4. Rewrite this README for the project.
5. Add a `.github/workflows/pr-checks.yml` calling bunyaad's reusable
   workflow — see [docs/reusable-workflows.md](docs/reusable-workflows.md).
6. Replace the owners in `.github/CODEOWNERS`.
7. Protect `main` — pull request required, status checks required:
   `pr-checks / Verify`, `security-gate / Security Check`.
8. Create the Sentry project —
   [docs/sentry-setup.md](docs/sentry-setup.md).
9. Install the Renovate GitHub App.

## When something fails

| Symptom                                | Where to look                                                      |
| -------------------------------------- | ------------------------------------------------------------------ |
| Import rejected by lint                | [src/features/README.md](src/features/README.md) — boundary rules  |
| Raw colour class blocked               | Use a semantic token — see the table in [CLAUDE.md](CLAUDE.md)     |
| `db diff` drops grants or invents them | [docs/supabase-diff-caveats.md](docs/supabase-diff-caveats.md)     |
| Pre-commit: unsigned commit            | [docs/COMMIT-SIGNING-AND-SSH.md](docs/COMMIT-SIGNING-AND-SSH.md)   |
| CI: security gate failure              | [docs/security-pipeline.md](docs/security-pipeline.md) — layer map |
| CI: db-checks red on purpose           | Run `pnpm db:push`, then re-run the workflow                       |
| App boots, Supabase features missing   | Check `.env.local` — both Supabase vars must be set                |
| Half-configured env error              | Set both Supabase vars or leave both blank                         |
| Sentry not reporting                   | Set `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`                       |

## Further reading

| Document                                                         | Type        | Covers                                            |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------------- |
| [DESIGN.md](DESIGN.md)                                           | reference   | Design system, tokens, retheming for a client     |
| [src/features/README.md](src/features/README.md)                 | reference   | Folder structure, import rules, where code goes   |
| [src/components/ui/README.md](src/components/ui/README.md)       | reference   | shadcn modification policy, deliberate deviations |
| [src/lib/supabase/README.md](src/lib/supabase/README.md)         | reference   | Why multiple clients, why no browser client       |
| [docs/how-auth-works.md](docs/how-auth-works.md)                 | explanation | Session lifecycle, cookies, proxy, edge cases     |
| [docs/folder-structure.md](docs/folder-structure.md)             | explanation | Why feature-first, with evidence from 8 sources   |
| [docs/ai-code-quality.md](docs/ai-code-quality.md)               | explanation | Why mechanical enforcement over convention        |
| [docs/reusable-workflows.md](docs/reusable-workflows.md)         | reference   | How CI is shared across repos, security model     |
| [docs/security-pipeline.md](docs/security-pipeline.md)           | reference   | Six-layer gate, tools vs custom scripts           |
| [docs/sentry-setup.md](docs/sentry-setup.md)                     | how-to      | Per-project Sentry configuration                  |
| [docs/COMMIT-SIGNING-AND-SSH.md](docs/COMMIT-SIGNING-AND-SSH.md) | how-to      | GPG signing and SSH setup on Windows              |
| [docs/supabase-diff-caveats.md](docs/supabase-diff-caveats.md)   | reference   | What db diff drops, review checklist              |
| [TODO.md](TODO.md)                                               | tracker     | Everything planned, item by item                  |
| [CLAUDE.md](CLAUDE.md)                                           | —           | Rules for editors (human and AI)                  |
