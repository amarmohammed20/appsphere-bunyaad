# Bunyaad

The AppSphere boilerplate. Every new client project starts from it.

What it standardises, and what is still planned:
[WHAT-YOU-GET.md](WHAT-YOU-GET.md).

## Run it

```bash
pnpm install
pnpm dev
```

It runs without a database. Supabase features stay off until you configure one.

## Start a project from it

1. **Use this template** on GitHub, or clone and re-point the remote.
2. Copy `.env.example` to `.env.local` and fill it in.
3. Update `name` in `package.json`.
4. Rewrite this README for the project.
5. Add a `.github/workflows/pr-checks.yml` calling bunyaad's shared workflow —
   see [docs/reusable-workflows.md](docs/reusable-workflows.md).
6. Protect `main` — pull request required, `pr-checks / Verify` required.
7. Add project-specific rules to `CLAUDE.md`.

## Commands

| Command                | Does                                     |
| ---------------------- | ---------------------------------------- |
| `pnpm dev`             | Development server                       |
| `pnpm build`           | Production build                         |
| `pnpm lint`            | ESLint, including the architecture rules |
| `pnpm type-check`      | TypeScript, no emit                      |
| `pnpm format`          | Prettier, write                          |
| `pnpm test:boundaries` | Proves the architecture rules still fire |
| `pnpm check:actions`   | Proves every GitHub action is pinned     |

pnpm only — `npm install` and `yarn` are blocked by `preinstall`.

## Working in it

Read [CLAUDE.md](CLAUDE.md) first. It is written for AI agents, but the rules
are the same for people.

Code goes in `src/features/<domain>/`. What belongs where is in
[src/features/README.md](src/features/README.md), with `contact/` as a worked
example.

The rules are enforced, not documented. Wrong-place code fails `pnpm lint`.

## Why it is built this way

Most of our code is now AI-written. AI produces code that runs but is often
poor quality, and conventions in a document get ignored. So the repository
enforces them mechanically instead.

Reasoning is recorded rather than assumed:

| Document                                                 | Covers                               |
| -------------------------------------------------------- | ------------------------------------ |
| [docs/ai-code-quality.md](docs/ai-code-quality.md)       | Why enforcement over convention      |
| [docs/folder-structure.md](docs/folder-structure.md)     | Why feature-first, with the evidence |
| [docs/reusable-workflows.md](docs/reusable-workflows.md) | How CI is shared across repos        |
| [TODO.md](TODO.md)                                       | Everything planned, item by item     |
