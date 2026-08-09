# Plan — Sentry and error handling

Working document for the `feat/sentry-and-error-handling` branch. Everything
below is taken from the official docs listed at the end, not from memory.

Two TODO items are delivered together because neither makes sense alone:

- section 15 — Sentry on client and server, with alerts and PII scrubbing
- section 24 — generic messages to users, full detail to logging

Error handling's whole point is _where the detail goes_. Build the pages first
and you write `console.error` and rewrite it a week later; build Sentry first
and there is nothing for it to catch.

---

## What we are building

### Part 1 — Error pages (needs nothing from you)

| File                   | Catches                                 | Constraint                                                              |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `app/error.tsx`        | render errors in that segment and below | must be `'use client'`                                                  |
| `app/global-error.tsx` | errors thrown by the **root layout**    | must render its own `<html>` and `<body>` — it replaces the root layout |
| `app/not-found.tsx`    | `notFound()` calls and unmatched routes | not an error boundary                                                   |

**Correction.** An earlier version of this document claimed Next 16 renamed
`reset` to `retry`. That is wrong, and it shipped as two dead buttons before a
review caught it. Verified in `node_modules/next/dist/client/components/error-boundary.js`:
Next 16.2.12 passes `error`, **`reset`** and `unstable_retry`. The string
`retry` is not a prop. Use `reset`.

**Explicit boundaries do not report themselves.** In production, Next calls its
global error handler only for its own built-in boundaries
(`react-client-callbacks/error-boundary-callbacks.js`); an explicit `error.tsx`
gets `console.error` and nothing more. Both `error.tsx` and `global-error.tsx`
therefore need their own `Sentry.captureException`.

**What error boundaries do not catch**, and this is the part usually missed:

- errors in **event handlers**
- errors in **async code that runs after render**

Those need `try`/`catch` plus `useState`. Which is why Server Actions must keep
returning `{ ok: false, error }` rather than throwing — the pattern
`src/features/auth/actions/` already uses. Adding error pages does not change
that rule; it only covers what genuinely escapes.

### Part 2 — Sentry wiring (needs the DSN)

Six files, per the current manual setup:

| File                        | Purpose                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `instrumentation.ts`        | registers server + edge; exports `onRequestError = Sentry.captureRequestError` |
| `instrumentation-client.ts` | browser init; exports `onRouterTransitionStart`                                |
| `sentry.server.config.ts`   | server `Sentry.init()`                                                         |
| `sentry.edge.config.ts`     | edge `Sentry.init()`                                                           |
| `app/global-error.tsx`      | also calls `Sentry.captureException()`                                         |
| `next.config.ts`            | wrapped in `withSentryConfig()`                                                |

`sentry.client.config.ts` is the **old** convention, replaced by
`instrumentation-client.ts`. `itc` has both and imports one from the other; we
will only have the current one.

Every init follows the pattern already used for Supabase, so a fresh clone with
no DSN stays silent instead of erroring:

```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
```

### Part 3 — PII (needs your region decision)

`sendDefaultPii` defaults to **`false`**, which already excludes IP addresses,
cookies, user-agent strings and request bodies. We leave it false.

What Sentry's own GDPR guidance puts on us is scrubbing _before_ sending, so:

- `Sentry.setUser({ id, role })` in the auth flow — **never email, never name**.
  The id is enough to find the row; the email is the thing that needs
  explaining to a client.
- `beforeSend` strips `Authorization` and `Cookie` as a backstop.

### Part 4 — Source maps (needs the Vercel integration)

Without uploaded source maps, production stack traces are minified and close to
useless. `sourcemaps.deleteSourcemapsAfterUpload` defaults to `true` — client
maps are deleted after upload, server maps kept for runtime errors. Leave it.

---

## What we need from you

### 1. Create the Sentry project

1. Sign up or sign in at sentry.io.
2. **Choose the data region during signup.** Sentry offers US or EU storage,
   and this is set at organisation creation. Our clients are UK, so **EU** is
   the safer default and it is not trivially changed afterwards.
3. Create a project, platform **Next.js**, name it `bunyaad`.
4. From **Settings → Projects → bunyaad → Client Keys (DSN)**, copy the DSN.

**Send me:** the DSN. The slugs are not needed in code — `next.config.ts` reads
`SENTRY_ORG` and `SENTRY_PROJECT` from the environment, which the Vercel
integration sets. They still appear in
the URL: `sentry.io/organizations/<org-slug>/projects/<project-slug>/`).

The DSN is not a secret — it is designed to ship in the browser bundle, and it
will live in `.env.example` as a blank key.

### 2. Sign the DPA

Sentry's GDPR page requires a Data Processing Addendum to be executed for
GDPR-compliant processing. It is a form in the Sentry dashboard, not a
negotiation. Do it once for the organisation, not per project.

### 3. Install the Vercel integration — when we deploy

This is the step that saves the most work later. Per Sentry's Vercel docs the
integration sets **all four** variables automatically:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_SENTRY_DSN`

Steps:

1. Go to `vercel.com/integrations/sentry`.
2. **Add Integration**, choose the Vercel scope and the project.
3. Link the Sentry project to the Vercel project when prompted.
4. Redeploy to trigger the first release.

It also enables release tracking and automatic source map upload.

**Until there is a Vercel project, skip this.** Nothing else is blocked by it.

### 4. Local environment

Add to your `.env.local` once you have the DSN:

```
NEXT_PUBLIC_SENTRY_DSN=
```

No auth token locally. Source maps upload from the deploy build, not from your
machine.

---

## Decisions, with a recommendation each

| Decision                              | Recommendation        | Why                                                                                                                   |
| ------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Data region                           | **EU**                | UK clients; set at org creation and awkward to change                                                                 |
| `sendDefaultPii`                      | **leave `false`**     | it is the default and already excludes IP, cookies, user-agent, bodies                                                |
| `setUser` contents                    | **id and role only**  | enough to identify, nothing to explain later                                                                          |
| `tracesSampleRate`                    | **1.0 dev, 0.1 prod** | traces are billed per event, errors are not                                                                           |
| Pino / `lib/logger.ts`                | **skip for now**      | Sentry captures errors; a second logging library earns its place when there are structured server logs worth shipping |
| `tunnelRoute`                         | **skip for now**      | see below                                                                                                             |
| `SENTRY_AUTH_TOKEN` in GitHub Actions | **do not add**        | see below                                                                                                             |

### Why not `tunnelRoute`

It proxies Sentry requests through our own domain so ad blockers cannot drop
them — which is a real problem, since a share of client errors never arrive
otherwise. But the documented drawbacks are real:

- browser traffic routed through our server increases load and hosting cost
- issues can show the **server's** IP instead of the user's
- the tunnel route must not match the Next middleware matcher, or client error
  reporting fails — and our `src/proxy.ts` matcher currently matches everything
  except static assets, so it would need changing
- a past SSRF advisory existed in this feature (fixed in 7.77.0)

Worth revisiting once there is real traffic and we can measure how many client
errors are being lost. Not worth it on day one.

### Why no auth token in CI

Our GitHub Actions run `next build` to **verify** the build, not to deploy. If
a token were present, every PR would upload source maps and create releases for
builds nobody ships. Source maps should upload from the deploy build only,
which the Vercel integration handles.

---

## Reference implementations, and which to trust

### Do not copy Sentry's own sample app

[getsentry/error-generator](https://github.com/getsentry/error-generator/blob/main/instrumentation-client.ts)
is what most tutorials reproduce, and it is a demo:

```ts
dsn: 'https://f4b6af72...@o1.ingest.us.sentry.io/4509497897648128', // hardcoded
tracesSampleRate: 1,
sendDefaultPii: true,
```

Hardcoded DSN, 100% tracing, PII **on**. It exists to generate errors on
demand, not to be a template.

### Copy Formbricks

[formbricks/formbricks](https://github.com/formbricks/formbricks), a production
Next.js app, `sentry.server.config.ts`:

| Setting             | Value                                     | Why                                             |
| ------------------- | ----------------------------------------- | ----------------------------------------------- |
| init                | only when the DSN is set, logs either way | same shape as `isSupabaseConfigured` here       |
| `sendDefaultPii`    | `false`                                   | the default, kept deliberately                  |
| `sendClientReports` | `false`                                   | stops the SDK sending its own usage telemetry   |
| `tracesSampleRate`  | `0`                                       | tracing off; errors are free, traces are billed |
| `beforeSend`        | drops `digest === "NEXT_NOT_FOUND"`       | see below                                       |

**The `NEXT_NOT_FOUND` filter is the most valuable line there.** Next throws an
internal error for every `notFound()` call, so without it every 404 becomes a
Sentry issue and real errors drown in them. This is not in the official setup
docs — it is learned after a week of noise.

`sendClientReports: false` is the second one worth taking. It is on by default
and sends SDK usage telemetry that has nothing to do with our errors.

**Adopt both.** Keep `tracesSampleRate` at `0.1` in production rather than
Formbricks' `0` — some tracing is worth having while the app is new, and it can
go to zero if the bill says so.

---

## Known gotchas

**Boundaries.** `instrumentation.ts` and `instrumentation-client.ts` may live at
the project root or in `src/`. In `src/` they would be rejected by
`boundaries/no-unknown-files` — the rule that stops an invented file escaping
the architecture. Either keep them at the repo root, or classify them in
`eslint.boundaries.mjs` the way `src/proxy.ts` already is.

**`next.config.ts` already has content.** It holds the security headers
(`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS).
`withSentryConfig()` wraps the config, so those must be verified to survive.

**A fresh clone must still run.** Same rule as Supabase: no DSN means Sentry is
disabled, not broken. This will be checked by building with no `.env.local`.

---

## Order of work

1. Error pages — `error.tsx`, `global-error.tsx`, `not-found.tsx`. No Sentry.
   Provable immediately by throwing on purpose.
2. Sentry wiring — the six files, disabled without a DSN.
3. `setUser` and `beforeSend`.
4. Source maps, via the Vercel integration.

Steps 1 and 2 need nothing from you. Step 3 needs the DSN. Step 4 needs Vercel.

---

## Sources

- [Sentry for Next.js — manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Sentry for Next.js — source maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
- [Sentry — Vercel integration](https://docs.sentry.io/integrations/deployment/vercel/)
- [Sentry — GDPR best practices](https://sentry.io/trust/privacy/gdpr-best-practices/)
- [Sentry — scrubbing sensitive data](https://docs.sentry.io/platforms/javascript/data-management/sensitive-data/)
- [Next.js — error handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [formbricks/formbricks](https://github.com/formbricks/formbricks) — production reference
- [getsentry/error-generator](https://github.com/getsentry/error-generator) — demo app, not a template
