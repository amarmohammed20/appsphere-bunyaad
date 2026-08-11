# Sam Clusker recommendations

Source: "Platform & Security Recommendations", ITC / Teleflow, prepared by Sam
Clusker, 4 August 2026 (PDF held by AppSphere).

The implementation trackers below are maintained by AppSphere and are not part
of Sam's original review. The source transcription that follows preserves the
wording of the PDF; only its layout has been adapted to Markdown. The original
PDF has not been modified.

## Overall tracker

Every sub-point Sam raised is tracked separately below. A parent is ticked only
when all of its children are.

- [ ] **1. Streamline GitHub Actions** - the remaining items are CI
      architecture work, not this branch.
  - [ ] One `ci.yml`: path-filtered fan-out to parallel jobs, reconverging on a
        single `ci-ok` required check. The three pipelines are still separate
        workflows; the security gate is now `workflow_call`-able, which is a
        prerequisite, but the fan-out/`ci-ok` architecture is not built.
  - [x] Shared composite action for setup (pnpm + Node + install + cache):
        `.github/actions/setup`, used by all four jobs across the three
        pipelines. Its `install` toggle exists so the security gate can
        provision the toolchain early while `pnpm install` stays gated behind
        the L3 supply-chain checks.
  - [ ] Cache `.next/cache`. The pnpm store is already cached by `setup-node`
        with `cache: pnpm`, and lives outside the repo, so Sam's note about
        gitignoring it does not apply here. No build cache yet — every PR
        still pays for the Next.js compile.
  - [x] One secret scanner per context. TruffleHog removed from `pr-checks`;
        all secret scanning (Gitleaks, TruffleHog, custom patterns) now lives
        only in the security gate, which also fires on push to main — the
        path a PR-only scan cannot see. One TruffleHog version, one run.
  - [x] Pin Semgrep to a container instead of `pip install` on every run.
  - [x] Pin all Docker images to image digests and all Actions to commit SHAs.
        Enforced mechanically by `scripts/check-action-pinning.mjs`.
  - [ ] Scheduled security jobs, the third pillar of Sam's target architecture.
        The ported `security-scheduled.yml` was deleted rather than carried
        forward disabled: it only ever ran on a manual click, and it still held
        the sister repo's assumptions. Rebuild it here, against Bunyaad, as
        part of this item. Without it nothing catches a CVE published against a
        dependency that is already installed, because no PR triggers that.
- [ ] **2. Vercel deployment** - deployment/infrastructure work, not this
      branch.
  - [ ] a) Drive production deploys through CI/CD; move `supabase db push` into
        a protected GitHub Environment.
  - [ ] b) Manage Vercel config in source with the Terraform Vercel provider.
  - [ ] c) Playwright smoke tests against production and preview deploys.
  - [ ] d) `/api/health` and `/api/health/ready` endpoints.
- [x] **3. Upgrade Node version** - Bunyaad workflows default to Node 22.
- [ ] **4. Dependabot vs Renovate**
  - [x] `renovate.json` written: conservative schedule, grouped non-major
        updates, dashboard approval for majors, no automerge. Bunyaad uses its
        existing three-day release age rather than Sam's suggested 14 days, so
        it matches `minimumReleaseAge: 4320` in `pnpm-workspace.yaml` — move
        both together if either changes.
  - [ ] Install the Renovate GitHub App. Until an admin does this the config
        file is inert and no update PRs are raised.
- [x] **5. Quick win tooling**
  - [x] ShellCheck over `scripts/security/*.sh` and `.husky/pre-commit`.
  - [x] actionlint over the workflows and their embedded `run:` shell.
  - [x] zizmor over the workflows, at default confidence with online audits on.
  - [x] checkov over the workflows, with the terraform and dockerfile
        frameworks already enabled so infrastructure is covered from the first
        such file rather than being wired later.
- [ ] **6. API rate limiting and auth** - consuming-application work. Bunyaad is
      a boilerplate and has none of the named routes.
  - [ ] `PUBLIC_WRITE` / `PUBLIC_READ` policies across public routes.
  - [ ] Rate limiting fails closed in production.
  - [ ] Anti-automation control (CAPTCHA/Turnstile or signed one-time token) on
        the email-sending route.
  - [ ] Harden `quoteRef` generation cryptographically.
  - [ ] Session/service auth on internal routes rather than the proxy allowlist
        alone.
- [ ] **7. Testing** - test-pipeline work, not this branch.
  - [ ] Unit tests on pure helpers, with a coverage threshold.
  - [ ] Tests on the money paths (Stripe webhook, checkout session, payment
        intent, coupons, mandates, order persistence).
  - [ ] Integration tests on API route handlers using their Zod schemas as the
        contract, including the error paths.
  - [ ] Playwright smoke suite (same work as item 2c).
  - [ ] `pnpm test` and the coverage gate in the test job; `pnpm audit`
        blocking once the backlog is zero.
- [ ] **End goal**
  - [ ] Workflow inputs/variables so consuming repos can adjust pipeline
        behaviour at runtime. Started: `pr-checks-reusable` takes
        `node-version`, `security-gate-reusable` takes `node-version`,
        `secret-scan` and the `SEMGREP_APP_TOKEN` secret. Not yet: the
        GHAS-dependent settings (SARIF upload, `advanced-security`) are still
        hardcoded off, which is right for private clones but should be an
        input so a public repo can opt in.
  - [ ] Remove remaining manual repetition (deploying, checking, testing by
        hand).

## Owner actions - repository settings, not code

None of the above protects anything until these are set. They need admin
access, so no pull request can deliver them.

- [ ] **Branch protection on `main`**: require a pull request, require the
      status checks below, and tick **"Do not allow bypassing the above
      settings"** — admins bypass by default, which makes every other item
      here optional. Block force pushes.
  - Required checks: `security-gate / Security Check`, `pr-checks / Verify`.
  - The security gate's check name changed with the reusable split. If an
    older `Security Check` is still listed it will never report again and
    every pull request waits on it forever.
- [ ] **Require review from Code Owners.** `.github/CODEOWNERS` exists and is
      inert until this is ticked.
- [ ] **Dependabot security alerts.** Free, needs no config file, and is the
      compensating control for deleting the scheduled scan above — without
      either, nothing watches for a CVE published against a dependency that is
      already installed.
- [ ] **Install the Renovate GitHub App** (same as item 4 above).

## Original review - verbatim transcription

# Platform & Security Recommendations

ITC / Teleflow — prepared by Sam Clusker · 4 August 2026

Target architecture: ci.yml path-filtered fan-out → single ci-ok gate → merge queue → deploy.yml (protected db-migrate + Vercel deploy + smoke tests) → scheduled security jobs.

## 1. Streamline GitHub Actions

Collapse the current overlapping workflows into one PR pipeline with parallel jobs and one required check.
pr-policy.yml and security-gate.yml both check out, install, and run a TruffleHog scan on every PR — on two different TruffleHog versions (v3.95.8 vs v3.96.0). Lint and type-check run twice (once as explicit steps, once inside prebuild).
No build cache, so every PR pays for a Next.js compile.
Resolution - One ci.yml in Bunyaad (you've started on this): a fast path-filter (changed files) job fans out to parallel jobs (static / test / build / code-security / supply-chain / conditional db-migrations), all converging on a single ci-ok gate that becomes the only required status check.
So you have:

1. Job trigger
2. Fan out to parallel jobs, each only running if their path-filter matches.
3. Once fan out complete, reconverge into a single job which runs check as a final approval that the pipeline passed.

Look into a shared composite action for setup (pnpm + Node + install + cache) so the logic lives once.
Composite Actions
Cache .next/cache and the pnpm store (I think you need to add pnpm store to gitignore also); run one secret scanner per context - pin Semgrep to a container instead of pip install on every run.

Pin all Docker images to image shas and Github Actions to commit hashes (supply chain attack prevention)

## 2. Vercel deployment — manage in source, drive via CI/CD, smoke-test, add health endpoints

Golden solution full autonomy with production deploys, run on repository tags/releases. Once new code has been done, passed all CI and merged to main, tag it and release it - have CD workflow trigger on the release. Use deployment mechanism to push it out to production, think Terraform vercel provider, or ArgoCD for GitOps solution.

### a) Drive production deploys through CI/CD.

Right now the Vercel Git integration deploys on its own, and — more importantly — database migrations are pushed to production by hand from a developer's laptop before the PR merges (pr-db-migrations.yml literally blocks the PR until someone has run pnpm run push:db). Look to move the supabase db push into a deploy.yml job running in a protected GitHub Environment, so migrations deploy after merge, in order, with an audit trail, and no prod credentials on laptops. Vercel then deploys gated behind that job.

### b) Manage Vercel config in source (Terraform).

Today the project's settings, environment variables, domains, and deployment protection live only in the Vercel dashboard — invisible, unversioned, unreviewable. In Terraform you can create modules, you can also deploy those modules in a registry so that they can be called by other repositories. Think of Bunyaad as the place where the Terraform sits and is versioned, much like the Github Actions, when you make changes, release a new version of the Terraform module. Consume that new version in a customer repository to handle their deploys. The Terraform Vercel provider lets you declare the project, env vars (values still from a secret store, not committed), domains, and protection rules as code.

The main benefits: changes are reviewed like any other PR, and the config is reproducible.

### c) Smoke-test on deploy.

After a deploy, a small Playwright suite could hit the live URL and check homepage renders, a journey reaches the quote step, key API routes respond. Runs against production on the main deploy, and against Vercel preview URLs on PRs (via the deployment_status event). Confirms the site actually works with full autonomy.

### d) Health endpoints to support (c).

Add lightweight routes the smoke tests:

- /api/health — liveness: returns 200 if the app is up. No dependencies touched.
- /api/health/ready — readiness: checks the things a request needs (Supabase reachable, catalogue query returns, Upstash reachable and rate limiting is actually active — see item 8). Returns a small JSON status per dependency. You can then inspect that JSON payload in a job in your CD workflow to give you a quick heads up if everything is okay.

Keep them unauthenticated but cheap and non-revealing (no version leaks, no secrets, booleans not internals).

The main benefit: Lets Vercel/an external monitor alert before a customer notices.

## 3. Upgrade Node version

Node 20 hit end-of-life on 30 April 2026 — no more security patches, over three months ago now.

## 4. Dependabot vs Renovate

Automated dependency-update PRs.

If you opt for dependabot, there is no .github/dependabot.yml in the repo. Dependabot has two separate features: (a) security updates / alerts, which can be toggled on in the repo's Security settings without a config file, and (b) version-update PRs, which require a dependabot.yml. dependabot.yml

Renovate is an option Can adhere to a deliberate 14-day minimum-release-age policy in .npmrc (don't install a version until it's been public long enough to be caught if poisoned). Renovate supports that natively (minimumReleaseAge: "14 days") so update PRs honour the same rule.

## 5. Quick win tooling: ShellCheck, actionlint, zizmor, checkov

What they are. Four linters/static code analysis tools for the parts of the repo that are currently unchecked:

- ShellCheck — lints shell scripts. There's a decent amount of bash in your repo: scripts/security/check-build-config.sh, the .husky/pre-commit hook, and large inline run: blocks in the workflows. ShellCheck catches quoting bugs, unset-variable errors, and the class of mistake that makes a security script silently pass.
- actionlint — lints GitHub Actions YAML: bad expressions, wrong contexts, deprecated syntax, and it runs ShellCheck on embedded run: scripts for free.
- zizmor — a security linter for GitHub Actions: catches injection via untrusted github.event.*, over-broad token permissions, unpinned actions. The security-gate workflow currently reimplements a chunk of this in hand-rolled grep - zizmor can do it better and is maintained, freeing up your own time.
- checkov - a security focussed static code analysis tool for infrastructure (something you may endeavour later) - can check Dockerfile, Helm charts, Terraform. Hadolint is another option for Dockerfile checks. Docker images exist for this publically you can use, probably also a checkov Github Action you can just straight up plug in.

All of these are single steps, no infrastructure, and they harden the security tooling, replacing bespoke shell with maintained tools. Let other teams do the work, just consume it. They fit straight into the static / security-code jobs.

## 6. API rate limiting and auth

The big one.

Rate limiting exists for exactly two policies (src/lib/api/common/rateLimit.ts): MANDATE (3/min) and PAYMENT (10/min, the /api/stripe/* routes). Everything else has no rate limit. And the limiter fails open — if Upstash isn't configured or the Redis call throws, checkApiRateLimit returns { success: true } and the request proceeds. So if Upstash is misconfigured or has an outage in production, even the payment and mandate limits silently switch off.

Two specific exposures worth naming in the meeting:

- Email abuse / phishing (/api/quote/email). This is a public POST (no auth, no rate limit) that takes a contactEmail from the request body and sends a real email via Resend with a PDF attached. An abuser can drive quote emails to arbitrary addresses from your domain — that's spam/phishing sent as ITC. This needs a rate limit and an anti-automation control (see below).
- Customer-data exposure (/api/quote/resume, /api/orders/[token]). resume is a public GET keyed only on a quoteRef; orders/[token] on a token. These return customer/order data with no session. Their safety depends entirely on those quote references being long, random, and unguessable, and on there being no way to enumerate them at speed. With no rate limit, a guessable or leakable reference can be brute-forced or scraped.

What we'd do.

- Extend the existing rate-limit framework (it's already done, can be reused — just add policies) to cover all public write/lookup routes: a PUBLIC_WRITE policy for quote/email, quote/save, help-request, sign; a PUBLIC_READ policy for quote/resume, orders/[token].
- Decide, per environment, that rate limiting fails closed in production. Fail-open is fine for local dev (the current rationale), but in prod a missing/erroring limiter should either block or at minimum fire a loud alert. You could surface it via the readiness health endpoint.
- Add an anti-automation control on the email-sending route: a CAPTCHA/Turnstile token, or a signed one-time token issued by the page that legitimately triggers it, so it can't be called headlessly in a loop. This with rate-limits will prevent bots from hammering the endpoint over and over when attempting to brute force.
- Verify the reference/token generation for quoteRef I would look to harden this with cryptography of some sort. QTE-YYYYMMDD-<this needs to be longer or more varied, think like how you do with passwords>
- For genuinely internal routes, require a session/service auth rather than relying only on the proxy allowlist. API paths are exposed publically, do they absolutely need to be? If it's a hard dev effort for this, just do the above so people can hit the API endpoint, but do nothing with it.

## 7. Testing — focus on helpers and money paths

You've begun work on building out the automated test suite.

Focus on the things that matter:

- Pure helpers (src/helpers/**) — the repo designs these to be "easily testable." Pricing maths, quote reference normalisation, session/idle-timeout logic, email HTML builders. Cheap to test, high regression value, no mocking needed.
- Money paths — the Stripe webhook handler (handleCheckoutSessionCompleted), checkout-session and payment-intent creation, coupon application, mandate preparation, and order persistence after a confirmed session. These move money and create commitments; a failure here is a financial/customer incident.
- Jest unit tests on helpers first (fast to write, immediate value), with a coverage threshold.
- Integration tests on the API route handlers using their Zod schemas as the contract (valid in / expected out, and importantly the error paths — the audit-relevant behaviour like "bad JSON returns 400, not 500").
- The Playwright smoke suite we covered previously.
- Make pnpm test and the coverage gate part of the test job in the new pipeline; make pnpm audit blocking only once the backlog is zero.

# Your End Goal

As much autonomy as possible, achieved with modularity in Bunyaad.

Develop in your central repository with your consuming repositories in mind:

- Github Action workflows include inputs/variables that consuming repos can supply at runtime to adjust the behaviour of the pipeline in its own repo, dependant on use case.
- Identify areas where you are manually repeating yourself over and over again and look to fix them through code.

Am I constantly deploying manually? Do I have to go to the website to check everything works? Do I have to test certain features of the website manually to confirm changes work?

If any of these types of questions get answered with ‘yes’ then there's work to do here. You want to focus on building, not deploying and testing manually.
