# Reusable workflows

## The problem this solves

Every repo built from bunyaad needs the same CI. Copying the workflow into each
one means a fix has to be applied N times, and repo number four never gets it.

GitHub can call a workflow that lives in another repository. So the workflow
lives here once, and every repo points at it.

## Setting up a new repo

Add one file. That is the whole integration.

`.github/workflows/pr-checks.yml`:

```yaml
name: PR Checks

on:
  pull_request:
    # ready_for_review: the job skips drafts, and without this event, marking a
    # draft ready never re-runs it — a required check would never be satisfied.
    types: [opened, synchronize, reopened, ready_for_review]
    # Every branch. A filter such as `branches: [main]` silently runs no checks
    # at all on pull requests targeting develop or a release branch.

concurrency:
  group: pr-checks-${{ github.event.pull_request.number }}
  cancel-in-progress: true

# Keep this. A called workflow can only reduce the caller's permissions, never
# raise them, so this line — not anything in the called file — is what caps
# what a compromised v1 could do.
permissions:
  contents: read

jobs:
  # Do not rename. The required status check is "pr-checks / Verify", built from
  # this job id and the called job's name.
  pr-checks:
    if: github.event.pull_request.draft == false
    uses: amarmohammed20/appsphere-bunyaad/.github/workflows/pr-checks-reusable.yml@v1
```

Then in the repo's settings, add **`pr-checks / Verify`** as a required status
check on `main` — that exact string, including the slash. GitHub builds it from
the caller's job id and the called job's name, and branch protection matches it
literally. Typing `Verify` creates a check that never reports, which blocks
every pull request forever.

## How updates reach existing repos

`@v1` is a moving tag. Repos referencing it pick up whatever `v1` points at on
their next pull request — nobody edits anything.

To ship a change:

```bash
git tag -f v1 && git push origin v1 --force
```

**The trade-off, stated plainly.** Anyone who can move the `v1` tag runs code
in every consuming repo, with that repo's token. One compromised token here, or
one approved-then-amended pull request, reaches all of them on their next run.
This repo _is_ the blast radius.

SHA-pinning the actions inside `pr-checks-reusable.yml` does not help with that
— it defends a different attack, where a third-party action author repoints
their own tag. Both are worth doing; neither substitutes for the other.

What actually caps the damage:

- **`permissions: contents: read` in the caller**, as in the template above. A
  called workflow can only reduce the caller's grant, never raise it, so this
  holds no matter what a rewritten `v1` declares.
- **Do not use `secrets: inherit`.** It hands a compromised `v1` every secret in
  the repo. Pass named secrets, and only the ones that run needs.
- **Protect the tag.** A ruleset on `refs/tags/v1` blocking force-push, with
  releases cut as immutable `v1.x` tags and `v1` moved deliberately. Tags are
  harder to protect than branches, so a `v1` branch under branch protection is
  the easier version of the same idea.

If a repo ever needs to opt out of automatic updates, it pins the SHA instead:

```yaml
uses: amarmohammed20/appsphere-bunyaad/.github/workflows/pr-checks-reusable.yml@<sha>
```

It then keeps working exactly as it did, and stops receiving updates. That is
the choice: current, or frozen. There is no version that is both.

## What it runs

In order, cheapest first:

| Step                      | Fails when                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| Base branch is merged in  | The branch has not merged `main`, so nothing after is trustworthy |
| Scan the diff for secrets | A key or token was committed                                      |
| Actions are pinned        | A workflow references an action by tag or branch, not a commit    |
| Formatting                | `pnpm format:check` finds unformatted files                       |
| Lint                      | Any ESLint rule, including the architecture boundaries            |
| Types                     | `tsc --noEmit` fails                                              |
| Architecture rules        | The boundary rules have stopped enforcing anything                |
| Build                     | `next build` fails                                                |

No test step yet, because there is no test suite. When one is added it goes
here, unconditionally — an `--if-present` escape hatch would let a repo add
tests that never run.

The architecture step is the non-obvious one. A boundaries config whose patterns
no longer match any folder passes lint silently, because nothing is classified
and so nothing is checked. That step lints deliberate violations and fails if
they are _not_ caught.

## Inputs

| Input          | Default | Use                                        |
| -------------- | ------- | ------------------------------------------ |
| `node-version` | `22`    | Override for a repo pinned to another Node |
| `secret-scan`  | `true`  | Disable only if the repo scans elsewhere   |

```yaml
uses: amarmohammed20/appsphere-bunyaad/.github/workflows/pr-checks-reusable.yml@v1
with:
  node-version: '20'
```

## Requirements

The workflow runs against the **consuming** repo's checkout, so everything below
has to exist there. A clone of this template has all of it.

- **Bunyaad must stay public**, or every consuming repo needs explicit access
  granted under Settings → Actions → General → Access. Public is simpler.
- **`packageManager` in `package.json`.** `pnpm/action-setup` is called without
  a version and reads that field; removing it fails the run with an error that
  does not name the cause.
- **The scripts the workflow calls**: `format:check`, `lint`, `type-check`,
  `test:boundaries`, `build`.
- **`scripts/check-action-pinning.mjs`.** Deleting it fails the run with a
  module-not-found error rather than an explanation.
- Secrets are not inherited. Pass named secrets in the caller job if a run
  needs them — never `secrets: inherit`, which exposes all of them.

## The DB checks workflow

It has **two** jobs, so there are two required status checks:

| Status check                            | Proves                                                      |
| --------------------------------------- | ----------------------------------------------------------- |
| `db-checks / Verify`                    | migrations align with the hosted project and replay cleanly |
| `db-checks / Schema matches migrations` | `supabase/schemas/` matches `supabase/migrations/`          |

Both must be added. `Verify` alone is not enough: every gate inside it keys off
changed files under `supabase/migrations/`, so editing a schema file and
forgetting `pnpm db:diff` fast-passes it. `Schema drift` watches the schema
files themselves and needs no secrets.

`db-checks-reusable.yml` is a second reusable workflow, same pattern: the
caller is `db-checks.yml`, and client repos reference it with:

```yaml
jobs:
  # Job id must stay `db-checks`: branch protection matches "db-checks / Verify".
  db-checks:
    if: github.event.pull_request.draft == false
    uses: amarmohammed20/appsphere-bunyaad/.github/workflows/db-checks-reusable.yml@v1
    secrets:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
```

What it proves on every pull request, in order:

| Stage                    | Fails when                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| Row level security       | Any migration creates a public table without enabling RLS           |
| Alignment                | Repo and hosted project disagree about migration history            |
| Rebuild                  | The full history does not replay cleanly on a fresh database        |
| Smoke checks             | The rebuilt database lacks what migrations plus seed promise        |
| Dry-run push             | The pending migrations would not apply to the hosted project        |
| Production push required | Checks pass but production has not been pushed yet — red on purpose |

When no migration files changed, everything after the RLS check is skipped and
the run finishes in seconds.

The red-on-purpose stage is the deliberate oddity: after `pnpm db:push` the
workflow is re-run and goes green. Merging is impossible until production
actually has the migration, which is the point.

It needs two secrets **in each consuming repo's own settings** (Settings →
Secrets and variables → Actions), holding **that project's** values — a client
repo compares against its own Supabase project, never bunyaad's:

| Secret                  | Where it comes from                                  |
| ----------------------- | ---------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens — generate one |
| `SUPABASE_PROJECT_REF`  | the id in the project's dashboard URL                |

Secrets are never shared through the reusable workflow: the caller passes them
by name, so a repo that has not configured them fails with a clear error
rather than silently comparing against the wrong database.

The consuming repo also needs `supabase/migrations/`, the `db:*` and
`check:db-*`/`check:rls`/`verify:db-reset` scripts, and `scripts/db/` — all
present in this template.

## If bunyaad is ever renamed

`uses:` follows GitHub's repository redirects, so consuming repos keep working.
But the old name becomes claimable, and every repo's `@v1` would then resolve to
whoever registers it. Re-register the old name as an empty tombstone repo
immediately, and update `OUR_REFS` in `scripts/check-action-pinning.mjs`, which
exempts the path by exact string.
