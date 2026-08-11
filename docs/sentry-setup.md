# Sentry setup

Every setting we chose, why, and how to repeat it for a new client project.

Two parts. The **organisation** is set up once for AppSphere and never again.
The **project** is set up per app — bunyaad has one, and so will every repo
cloned from it.

The code-side decisions (PII scrubbing, error filtering, runtime configs)
are in the source files under `src/lib/sentry/` and the instrumentation
files at the project root.

---

## Part 1 — The organisation (once, already done)

| Setting                 | Value                 | Why                                                                            |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------ |
| Organisation slug       | `appsphere`           | one org for the agency; a project per client app inside it                     |
| Display name            | `AppSphere`           |                                                                                |
| **Data storage region** | **🇪🇺 European Union** | **Set at organisation creation and not changeable afterwards.** Clients are UK |
| Default member role     | `Member`              |                                                                                |
| Debug Files Access      | `Admin`               | controls who can download source maps — i.e. read unminified source            |

**One organisation, many projects.** `appsphere/bunyaad`,
`appsphere/client-a`, `appsphere/client-b`. Separate error streams and alerts,
shared billing, one DPA, one region decision.

Creating an organisation per project would mean repeating the DPA and the
region choice every time, and getting the region wrong once is permanent.

### Data Processing Addendum

Sign the DPA in the Sentry dashboard, **once for the organisation**. Sentry's
GDPR guidance treats it as the contractual half; the technical half is the PII
configuration in the code (see the plan document).

---

## Part 2 — A new project (repeat per app)

### Create it

1. **Projects → Create Project**.
2. Platform: **Next.js**. Not React, not Node — the Next SDK covers browser,
   server and edge in one package, and only it provides `onRequestError`,
   source map upload and `withSentryConfig`.
3. Name it after the repo. Sentry may auto-name it `javascript-nextjs`; rename
   it. The slug is what the Vercel integration passes as `SENTRY_PROJECT`, and
   what appears in every alert email.
4. **"Connect your code" — skip it.** Installing the GitHub integration needs
   admin rights on the repo, and nothing we build depends on it. Release
   tracking comes from the Vercel integration instead. Add it later under
   **Settings → Integrations** if suspect-commit links are wanted.
5. **Do not run `npx @sentry/wizard`.** It rewrites `next.config.ts`, which in
   this repo holds the security headers. The files are added by hand.

### Copy the DSN

**Settings → Projects → \<project\> → Client Keys (DSN)**.

```
https://<key>@o<org-id>.ingest.de.sentry.io/<project-id>
```

`ingest.de` confirms the EU region. `ingest.us` means the organisation was
created in the US region — worth fixing immediately, because it cannot be
changed later.

The DSN is **not a secret**. It is designed to ship in the browser bundle, so
it belongs in `.env.example` as a blank key and in the deploy environment as a
value. It does not go in a secret store.

### Project settings

**Settings → Projects → \<project\> → General Settings**

| Setting                           | Value             | Why                                                                                                                                              |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Subject Prefix                    | `[<project>]`     | unprefixed alert emails are unsortable once the org has several projects                                                                         |
| **Spike Protection**              | **ON**            | **The one that protects money.** A render loop can burn a monthly quota in minutes; this rate-limits automatically                               |
| Auto Resolve                      | `Disabled`        | auto-resolve closes issues that have not recurred. On a new app "has not recurred" usually means "nobody visited that page"                      |
| Debug Files Access                | Inherit (`Admin`) | source maps are unminified source; keep them admin-only                                                                                          |
| Allowed Domains                   | `*` at first      | see below — must be tightened at deploy                                                                                                          |
| Enable JavaScript source fetching | **OFF**           | it scrapes JS from public URLs to guess context. Unreliable, and redundant once real source maps upload                                          |
| Enable SCM Source Context         | **OFF**           | needs the GitHub integration we skip                                                                                                             |
| Verify TLS/SSL                    | **ON**            | only applies when Sentry calls your domain, which source-fetching-off prevents — but leave it on so enabling that later is not silently insecure |

### At deploy time — tighten Allowed Domains

The DSN is public. With `Allowed Domains` set to `*`, anyone who copies it out
of your bundle can send events to your project and exhaust the quota. Sentry
filters on the `Origin` / `Referer` header.

The moment a production domain exists, set:

```
https://<production-domain>
http://localhost:3000
```

Leave `*` only while the app has no deployed domain.

### At deploy time — install the Vercel integration

1. `vercel.com/integrations/sentry`
2. **Add Integration**, choose the Vercel scope and project.
3. Link the Sentry project to the Vercel project.
4. Redeploy to cut the first release.

`next.config.ts` reads these from the environment rather than hardcoding them,
so a repo cloned from bunyaad needs no edit — the integration supplies each
client project its own values.

It sets `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` and
`NEXT_PUBLIC_SENTRY_DSN` automatically, and enables release tracking and source
map upload.

**No `SENTRY_AUTH_TOKEN` in GitHub Actions.** CI runs `next build` to verify,
not to deploy. A token there would upload source maps and cut a release for
every pull request, for builds nobody ships.

---

## Local environment

```
NEXT_PUBLIC_SENTRY_DSN=
```

No auth token locally — source maps upload from the deploy build.

With the key blank, Sentry initialises **disabled**, the same way an
unconfigured Supabase leaves the app running. A fresh clone must never need a
Sentry account to start.

---

## Checklist for a new client project

- [ ] Create the project under the `appsphere` org — do not create a new org
- [ ] Platform **Next.js**
- [ ] Rename the project to match the repo
- [ ] Skip "Connect your code"; do not run the wizard
- [ ] Subject prefix `[<project>]`
- [ ] **Spike Protection ON**
- [ ] JavaScript source fetching **OFF**, SCM Source Context **OFF**
- [ ] Copy the DSN into the deploy environment and `.env.local`
- [ ] At deploy: restrict Allowed Domains
- [ ] At deploy: install the Vercel integration
