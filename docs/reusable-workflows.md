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
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: pr-checks-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  ci:
    if: github.event.pull_request.draft == false
    uses: amarmohammed20/appsphere-bunyaad/.github/workflows/pr-checks-reusable.yml@v1
```

Then in the repo's settings, add **Verify** as a
required status check on `main`.

## How updates reach existing repos

`@v1` is a moving tag. Repos referencing it pick up whatever `v1` points at on
their next pull request — nobody edits anything.

To ship a change:

```bash
git tag -f v1 && git push origin v1 --force
```

**The trade-off, stated plainly.** A moving tag means a mistake here breaks CI
in every repo at once, and anyone who can push to bunyaad can run code in all of
them. That is the cost of automatic propagation, and it is why the actions
inside `pr-checks-reusable.yml` are pinned to commit SHAs rather than tags — the blast
radius stops at this repo.

If a repo ever needs to opt out of that, it pins the SHA instead:

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
| Formatting                | `pnpm format:check` finds unformatted files                       |
| Lint                      | Any ESLint rule, including the architecture boundaries            |
| Types                     | `tsc --noEmit` fails                                              |
| Architecture rules        | The boundary rules have stopped enforcing anything                |
| Build                     | `next build` fails                                                |

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

- **Bunyaad must stay public**, or every consuming repo needs explicit access
  granted under Settings → Actions → General → Access. Public is simpler.
- The consuming repo needs the scripts the workflow calls: `format:check`,
  `lint`, `type-check`, `test:boundaries`, `build`. All exist in this template.
- Secrets are not inherited automatically. A repo that needs them passes
  `secrets: inherit` in its caller job.
