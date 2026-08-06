# What to expect from Bunyaad

The starting point for every new client project. Item-level detail in
[TODO.md](TODO.md).

## The project

- **Stack** — Next.js 16, React 19, TypeScript, Tailwind 4, Supabase.
- **Folder structure** — feature-first, documented, with a worked example.
- **Component library** — shadcn/ui, theme tokens, dark mode, fonts.
- **UI rules** — mobile-first, minimum touch targets, no hover-only actions.
- **SEO** — metadata, sitemap, robots, social cards, structured data.
- **Knowledge base** — folder structure and pattern for articles and content.
- **Internationalisation** — locale routing and translation files.
- **Multi-domain** — marketing site and logged-in app on one domain and a
  subdomain, sharing one login.
- **Legal pages** — privacy, terms, cookie consent, account deletion.

## Code quality

- **TypeScript** — strict mode, no loopholes.
- **ESLint** — every rule blocking, none advisory.
- **Prettier** — one format, applied automatically.
- **Structure enforced** — the build fails if code lands in the wrong place.
- **Rules self-tested** — a check that proves the rules still catch violations.
- **No silent overrides** — switching a rule off requires a written reason.
- **Pre-commit hook** — lint runs before a commit is allowed.
- **Shared editor setup** — every machine behaves the same.

## Database and backend

- **Supabase** — server client plus session refresh, safe on a fresh clone with
  no database. Session cookies are `HttpOnly`.
- **SQL migrations** — versioned files, one promotion path to production.
- **Query layer** — all database access in one place, never in the UI.
- **Row-level security** — required on every table.
- **Typed queries** — generated from the real schema.
- **Authentication** — sign up, sign in, reset, OAuth, roles, protected routes.
- **API layer** — one route pattern, validated input, ownership checks.
- **File storage** — upload rules, size limits, signed URLs for private files.
- **Background jobs** — scheduled and long-running task patterns.

## Pipelines

- **On every pull request** — format, lint, types, structure, build, secrets.
- **Database migrations** — checked before they reach an environment.
- **Security scanning** — dependencies, secrets, code analysis.
- **Pull request policy** — template, title, size, and label checks.
- **Slack notifications** — build and deploy status.
- **Reusable** — future projects inherit all of it; fix once, applies everywhere.

## Safety

- **Main branch locked** — no direct pushes, PR and approval required.
- **Supply chain** — new package versions quarantined before use.
- **Package manager** — pnpm pinned; npm and yarn blocked.
- **Secrets** — validated environment variables, nothing hardcoded.
- **Runtime security** — rate limiting, CORS, security headers, input validation.
- **Sensitive data** — rules for URLs, storage, and what errors may reveal.
- **Error handling** — generic messages to users, full detail to logging.

## Running it

- **Logging** — Sentry on client and server, with alerts and PII scrubbing.
- **Environments** — local, staging, production, kept separate.
- **Deployment** — hosting and domains documented per project.
- **Safe releases** — feature flags, staged rollout, a rollback procedure.
- **README** — what it is, how to start a project, post-clone checklist.

## Working with AI

- **Workflow guide** — how to take a feature from prompt to merged pull request.
- **Context file** — the rules Claude reads before writing code.
- **Write-time hooks** — an agent is blocked as it writes, not corrected later.
- **Fast linting** — checks quick enough to run after every file an agent writes.
- **Skills** — scaffolding and review tasks defined once, reused everywhere.
- **Subagents** — code, security, migration and test reviewers.
- **Role-based workflow** — product, architecture, design, QA, security, release.
- **MCP servers** — Supabase, Figma and browser tools wired in.
- **Automated PR review** — a second pass on every pull request.
- **Decisions written down** — why each choice was made, not just what.

## Why it matters

Most of our code is now AI-written. AI produces code that runs but is often
poor quality. Rules in a document get ignored. Rules in the repo cannot be.
