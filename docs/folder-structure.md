# What folder structure should bunyaad ship?

Working document. Evidence first, then decide.

## The question

One real architectural choice, everything else is detail:

- **Layer-first** — `components/auth/`, `helpers/auth/`, `schemas/auth/`
- **Feature-first** — `modules/auth/components/`, `modules/auth/schemas/`

Our guard rails doc (Section 9) specifies layer-first with domain subfolders.
The evidence below suggests it lost.

## Patterns catalogue

Every approach found so far. Not all are alternatives — some combine.

### 1. Layer-first

Top level is the kind of code. Domain is a subfolder inside each.

```
src/
├── components/[domain]/
├── data/[domain]/
├── helpers/[domain]/
├── schemas/[domain]/
├── lib/
└── types/
```

- **Used by:** our guard rails doc, appsphere, theflexstorage, itc
- **For:** easy to state, easy to lint by path, obvious where a _kind_ of thing
  goes
- **Against:** one feature is scattered across five folders. Deleting a feature
  means five places. Encourages `helpers/` vs `utils/` ambiguity.

### 2. Feature-first

Top level is the feature. Layers live inside it.

```
src/
├── features/[feature]/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── components/     shared UI only
├── lib/
└── app/            routes
```

- **Used by:** Bulletproof React, Unicare
- **For:** a feature is one folder — add, delete, or hand it over in one place
- **Against:** needs a hard rule for what is shared vs feature-owned, or the
  shared layer duplicates (Unicare has three homes for components)

### 3. Bulletproof React — feature-first with a unidirectional rule

<https://github.com/alan2207/bulletproof-react>

The reference implementation, and the only source found so far that specifies
_enforcement_ rather than just layout.

Top level: `app`, `assets`, `components`, `config`, `features`, `hooks`, `lib`,
`stores`, `testing`, `types`, `utils`.
Inside a feature: `api`, `assets`, `components`, `hooks`, `stores`, `types`,
`utils` — only the ones that feature needs.

Two rules that matter more than the layout:

1. **Features must not import from other features.** Compose them at the app
   layer instead.
2. **Code flows one way: `shared → features → app`.** Shared can be used
   anywhere; features may only import shared; app may import both.

Explicitly recommends enforcing this with `import/no-restricted-paths`. This is
the same idea as our deny-by-default plan.

### 4. Route colocation (Next.js native)

Keep everything a route needs next to the route.

```
app/dashboard/
├── page.tsx
├── _components/       underscore = private, not a route
├── schema.ts
└── actions.ts
```

- **`_folder`** — private folder, Next.js will not turn it into a route
- **`(folder)`** — route group, organises and shares layouts without changing
  the URL

- **For:** shortest path from route to its code; nothing global gets cluttered
- **Against:** anything used by two routes has to move, so there is constant
  churn between colocated and shared

### 5. Hybrid — the common 2026 advice

Colocate route-specific code under `app/`, promote anything shared across
routes into `features/` or `lib/`.

- **For:** matches how code actually grows; avoids a global folder full of
  single-use components
- **Against:** the promotion rule has to be explicit, or people guess

## Evidence

### appsphere / theflexstorage / itc — layer-first

| Folder       | appsphere   | theflexstorage | itc       |
| ------------ | ----------- | -------------- | --------- |
| `@types`     | yes         | yes            | yes       |
| `app`        | yes         | yes            | yes       |
| `components` | yes         | yes            | yes       |
| `data`       | yes         | yes            | yes       |
| `lib`        | yes         | yes            | yes       |
| `helpers`    | yes         | no             | yes       |
| `utils`      | yes         | no             | yes       |
| schemas      | `schema`    | `schemas`      | `schemas` |
| `hooks`      | yes         | no             | no        |
| `actions`    | no          | no             | yes       |
| `server`     | no          | no             | yes       |
| `database`   | no          | yes            | no        |
| `Layouts`    | no          | yes            | no        |
| config       | `constants` | no             | `config`  |

Survived in all three: `@types`, `app`, `components`, `data`, `lib`.
Everything else diverged.

Problems visible without opening a file:

- **`helpers/` and `utils/` both exist** in two repos. No stateable rule for
  which is which, so both become junk drawers.
- **`schema` vs `schemas`** — singular in one repo, plural in two.
- **`Layouts/` is PascalCase** while every sibling is lowercase. Our own guard
  rails doc warns this causes TS1261 failures on Linux CI.
- **`types/` exists nowhere** — all three use `@types/`. The doc says `types/`.

The documented structure is aspirational, not descriptive.

### Unicare (irenictech) — feature-first

The most mature example, and the most instructive.

```
src/
├── app/          routes
├── modules/      18 features: admin, appointments, auth, clients, invoices...
├── shared/       components, hooks, services, types, utils
├── components/   25 files, PascalCase
├── hooks/
├── lib/          45 entries
├── stores/
└── types/
```

**The good idea** — everything for a feature lives together:

```
modules/clients/
├── api/
├── components/
├── hooks/
├── types/
└── contacts.schema.ts
```

**How it drifted:**

1. **Three homes for shared components** — `src/components/` (25 files),
   `src/shared/components/` (6 files), and `modules/*/components/`. No
   stateable rule. Same failure as `helpers/` vs `utils/`.
2. **`lib/` is a junk drawer** — 45 entries. `date.ts`, `duration.ts`, `ids.ts`
   next to `stripe/`, `supabase/`, `billing/`. Also contains `mockData.ts` and
   `sampleStaffData.ts` — fixtures in production code.
3. **No consistent internal shape.** Three modules, three shapes:
   - `auth/` → `api/`, `hooks/`, plus a loose `AcceptInvitePage.tsx`
   - `clients/` → `api/`, `components/`, `hooks/`, `types/`, loose `.schema.ts`
   - `invoices/` → `dummyData/`, `generate/`, `ndis-claims/`, `tabs/`
4. **`dummyData/` inside a production module.**

### External resources

One subsection per resource researched.

#### nextbase-nextjs-supabase-starter

<https://github.com/imbhargav5/nextbase-nextjs-supabase-starter>

Free MIT boilerplate, Next.js 16 + Supabase + Tailwind 4. 801 stars, last
pushed 2026-07-01. The closest match to what we are building.

pnpm + Turborepo monorepo: `apps/web`, `apps/database`,
`packages/typescript-config`. Inside `apps/web/src`:

```
app/  components/  constants.ts  contexts/  data/  hooks/
lib/  proxy.ts  rsc-data/  styles/  supabase-clients/  types.ts  utils/
```

Patterns worth stealing:

- **`supabase-clients/`** — `client.ts`, `middleware.ts`, `server.ts`. One
  folder, three clients, named by where they run.
- **`data/` split by auth level** — `anon/`, `auth/`, `user/`. Data access
  organised by who may call it, not by entity. Nobody else does this, and it
  puts authorisation in the path.
- **`rsc-data/` separate from `data/`** — server-component fetching kept apart
  from client-side.
- **Schema-first migrations.** Edit `apps/database/supabase/schemas/*.sql`,
  generate with `supabase db diff -f <name>`. Migrations are never hand-edited.
- **`.agents/skills/` as the single home for skills**, with an explicit rule:
  "Do not duplicate them in `.cursor`, `.codex`, `.claude`, or other
  runner-specific directories." Answers our cross-tool skills question.
- **`AGENTS.md` is numbered rules and setup steps, not prose.**
- **Ships Oxlint** (`oxlint.json` at root) alongside ESLint.

Risks: Turborepo complexity we may not need. Their `oxlint.json` is minimal
(`no-unused-vars: warn`, `no-console: off`) so it is barely doing any work.

#### bulletproof-react

<https://github.com/alan2207/bulletproof-react>
<https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md>
<https://github.com/alan2207/bulletproof-react/blob/master/apps/nextjs-app/README.md>

The reference architecture. Not a starter — documented opinions plus example
apps.

Top level: `app`, `assets`, `components`, `config`, `features`, `hooks`, `lib`,
`stores`, `testing`, `types`, `utils`. Inside a feature: `api`, `assets`,
`components`, `hooks`, `stores`, `types`, `utils` — only what that feature
needs.

Two rules that matter more than the layout:

1. **Features must not import from other features.** Compose at the app layer.
2. **Code flows one way: `shared → features → app`.**

Explicitly recommends `import/no-restricted-paths` to enforce it.

The Next.js example lives at `apps/nextjs-app`, needs Node 20+ and Yarn, and
runs against a **mock server on port 8080** — so it does not demonstrate the
Supabase-in-server-component pattern we need.

#### Klickbee/feature-driven-architecture

<https://github.com/Klickbee/feature-driven-architecture>

Docs-only specification. 11 stars, last pushed 2025-10-30. Small and unproven,
but the most **prescriptive** source found.

Top level: `src/{app, feature, shared, providers, styles, types}`, plus
`tests/` and `config/` at root.

Fixed feature shape — the part worth taking:

```
src/feature/<name>/
├── api/          route handlers, re-exported into app/api
├── components/
├── hooks/
├── lib/          server actions and internal logic
├── queries/      React Query hooks
├── options/      query configuration
├── schemas/      Zod
├── stores/       Zustand
├── types/
└── index.ts      the feature's public API
```

App Router integration — features own the handler, `app/` only re-exports:

```ts
// src/app/api/admin/user/route.ts
export { GET, POST } from '@/feature/user/api/apiUser';
```

Naming conventions:

| Type             | Convention      | Example          |
| ---------------- | --------------- | ---------------- |
| React Query hook | `use` prefix    | `useUserList.ts` |
| Zustand store    | `Store` suffix  | `userStore.ts`   |
| Zod schema       | `Schema` suffix | `userSchema.ts`  |
| API handler      | `api` prefix    | `apiUser.ts`     |
| Component        | PascalCase      | `UserTable.tsx`  |

Limitations: one author, no reference implementation, assumes React Query and
Zustand which we have not chosen.

#### salmandotweb/nextjs-supabase-boilerplate

<https://github.com/salmandotweb/nextjs-supabase-boilerplate>

102 stars, **last pushed 2023-10-03** — nearly three years stale.
`src/{app, components, hooks, lib, providers, sections}` with `actions/` and a
single `database.sql` at root instead of migrations.

Useful only as a counter-example: `sections/` alongside `components/` is
another two-homes-for-one-thing case.

#### nhanluongoe/nextjs-boilerplate

<https://github.com/nhanluongoe/nextjs-boilerplate>

40 stars, last pushed 2026-07-22. Next 16, NextAuth, commitlint.

The distinctive idea: **features live inside `app/`, not beside it.**

```
src/
├── app/
│   ├── (auth)/                  route group — private
│   │   └── profile/page.tsx
│   ├── (unauth)/                route group — public
│   │   └── products/
│   │       ├── components/      colocated, product-only
│   │       └── page.tsx
├── components/                  global, with ui/ for atomic primitives
├── api/                         global route handlers
├── libs/                        third-party wrappers
├── types/
└── styles/
```

Stated rule: global things in `src/`, feature things inside the route folder.
The `(auth)` / `(unauth)` route-group split separates authenticated shells from
public pages and is Next-native.

Downside: anything shared by two routes has to move out — the churn problem.

#### supastarter

<https://supastarter.dev/nextjs-supabase-boilerplate>

Paid: Solo $349, Startup $799, Agency $1,499, one-time. Next.js + React +
Tailwind + Radix + shadcn/ui on the front; Hono.js + Supabase + Postgres
behind. Prisma **or** Drizzle. Auth with passkeys and 2FA, RBAC, multi-tenancy,
Stripe/Lemonsqueezy/Polar, i18n, email templates, admin dashboard, Playwright.

Cannot inspect the structure without buying. Database-agnosticism adds an
abstraction layer we would not need; Hono.js is an extra framework on top of
Next route handlers.

#### Vercel Supabase template

<https://vercel.com/templates/next.js/supabase>

Vercel's own free starter. App Router with cookie-based auth via
**`@supabase/ssr`**, session available in Client Components, Server Components,
Route Handlers, Server Actions and Middleware. TypeScript, Tailwind, shadcn/ui.

Minimal — auth only, no folder-structure opinion. But it is the authoritative
reference for the `@supabase/ssr` wiring, which is what Section 23 needs.

#### Supalaunch (IndieHackers)

<https://www.indiehackers.com/post/i-built-a-saas-boilerplate-for-nextjs-and-supabase-ad798d3133>

Founder launch post. Next + Supabase with auth, storage, Stripe, OpenAI,
landing page, email. **No architecture or folder structure described at all.**
Nothing structurally useful.

#### freeCodeCamp — Reusable architecture for large Next.js apps

<https://www.freecodecamp.org/news/reusable-architecture-for-large-nextjs-applications/>

The most detailed source found. Six layers.

1. **App Router colocation** — route segments own `page.tsx`, `layout.tsx`,
   `loading.tsx`, `error.tsx`, plus `components/` and `lib/queries.ts`.
   "A file should live as close as possible to where it's used."
2. **Features with barrel public APIs** — `src/features/auth/{components,hooks,lib}/`
   plus `index.ts`. Other features import `@/features/auth`, never
   `@/features/auth/lib/tokenStorage`. `shared/` has zero knowledge of features.
3. **Turborepo monorepo** — `apps/{web,admin,marketing}` +
   `packages/{ui,config,auth,database,utils}`, with `transpilePackages`.
4. **Server/client boundaries** — data flows server → client only. Push
   `'use client'` as far down as possible. Server Components import data layers
   directly; **Client Components never do** — they call Server Actions.
   Server Actions in `app/[route]/actions.ts`.
5. **Testing** — Vitest for packages and features, Playwright for critical
   flows only. Tests colocated as siblings, not in `__tests__/`. Test features
   through the barrel.
6. **CI with Turborepo** — `--filter="...[origin/main]"`, remote caching.

Six import rules, stated explicitly:

1. Within a feature — import internals freely
2. Outside a feature — only via `@/features/[name]`
3. Shared — may import shared or packages only
4. Packages — never import features or apps
5. Server Components — may import data/query packages
6. Client Components — never import data packages; use Server Actions

#### dev.to — Feature-driven architecture with Next.js

<https://dev.to/rufatalv/feature-driven-architecture-with-nextjs-a-better-way-to-structure-your-application-1lph>

`src/{app, components, features, lib, types}` with
`features/[name]/{components,hooks,services,types}` and a `features/shared/`.

The mechanism is **`index.ts` as a gateway**:

```ts
// features/auth/index.ts
export * from './components';
export { signIn, signOut } from './services';
export type { User, AuthCredentials } from './types';
```

Anything not exported stays private.

Relies on _discipline_ rather than lint rules. Also allows features to import
other features via their public API — which **contradicts** Bulletproof's
"compose at app layer" rule.

#### Medium — Feature-based architecture that actually works

<https://medium.com/@nishibuch25/scaling-react-next-js-apps-a-feature-based-architecture-that-actually-works-c0c89c25936d>

`app/`, `components/{ui,shared,features}`,
`lib/{api,hooks,stores,utils,queries}`, `types/`.

Note: puts feature components under `components/features/` rather than a
top-level `features/` — so despite the title it is closer to layer-first. Thin
on import rules and enforcement. Mainly evidence that "feature-based" is used
loosely.

#### groovyweb — Next.js full-stack project structure

<https://www.groovyweb.co/blog/nextjs-project-structure-full-stack>

`/app` (routing only), `/components/{ui,features,layouts}`,
`/lib/{actions,db,auth,validations,utils}`, `/hooks`, `/stores`, `/types`,
`/agents`, `/public`.

The rule worth quoting: **"Nothing in `/lib` should import from `/components`
or `/app`."** Flow is one direction: app → components → lib.

Other positions:

- **Minimise API routes.** Server Components remove the need for most. Reserve
  `app/api` for webhooks, streaming, and external integrations.
- Database queries in `/lib/db/queries`, never in components.
- Server Actions in `/lib/actions/` by domain — **contradicts** freeCodeCamp,
  which colocates them in the route.
- `/agents/{prompts,tools,workflows}` — prompts as typed modules, never
  hardcoded strings.

#### Reddit — practical guide on Next.js folder structure

<https://www.reddit.com/r/nextjs/comments/1psrdiz/i_wrote_a_practical_guide_on_nextjs_folder/>

**Not retrieved** — Reddit blocks automated fetching. Needs manual review.

#### Comparison listicles

<https://designrevision.com/blog/best-nextjs-boilerplates>
<https://adminlte.io/blog/nextjs-starter-kits/>
<https://adminlte.io/blog/nextjs-saas-templates/>
<https://makerkit.dev/blog/saas/best-nextjs-saas-boilerplate>

Low structural value individually — none describe folder layouts in detail.
Useful for market picture and consensus:

- **Stated 2026 consensus stack:** App Router, TypeScript strict,
  Drizzle/Prisma, Clerk/Auth.js, Stripe, Tailwind + shadcn/ui, Resend, Vercel.
- **Maintenance heuristic:** 3+ months without commits is a red flag.
- Notable free options: **T3 Stack** (28.9k stars), **ixartz
  Next-js-Boilerplate** (12.9k, Next 16 + Drizzle + Clerk + Vitest + Playwright
  - Storybook), **Saasfly** (Turborepo).
- `shadcn-ui/next-template` is **archived** — superseded by `npx shadcn init`.
- **MakerKit now scores boilerplates on "AI-coding readiness (AGENTS.md files,
  MCP servers)."** Shipping agent config has become a judged criterion. That is
  precisely what bunyaad is aiming at.
- MakerKit puts multi-tenancy "in the database, enforced by Postgres Row Level
  Security" rather than application-level.
- makerkit's comparison discloses its own bias — they built MakerKit.

## What the evidence says

**Feature-first wins the axis.** Unicare is the largest and most mature of the
four, and co-locating a feature is the part that clearly worked.

**But "features exist" is not a structure.** Every repo here decayed the same
way, layer-first or feature-first, and always for one of two reasons:

1. **More than one home for the same kind of thing.** `helpers/` vs `utils/`.
   `components/` vs `shared/components/`. Once there are two, there is no rule,
   and both fill with whatever was nearest.
2. **No prescribed shape inside a unit.** Each feature invents its own layout,
   so nobody can guess a path.

Both are enforceable rather than documented — which is the whole reason
deny-by-default (`eslint-plugin-boundaries`) matters.

### Where every source agrees

- App Router, TypeScript strict, Tailwind + shadcn/ui, Zod, Playwright for E2E
- `app/` holds routing only — no business logic
- Client Components must not touch the data layer; use Server Actions
- There must be exactly one shared layer, and it must not know about features

### Where sources actively disagree — our real decisions

1. **Server Actions location** — colocated `app/[route]/actions.ts`
   (freeCodeCamp) vs centralised `lib/actions/` (groovyweb).
2. **May features import other features?** No, compose at app layer
   (Bulletproof) vs yes, via public barrel (dev.to).
3. **`features/` beside `app/` or inside it** — beside (Bulletproof,
   freeCodeCamp, dev.to, Klickbee) vs inside route folders (nhanluongoe).
4. **Enforcement** — lint-enforced (Bulletproof, freeCodeCamp) vs barrel
   discipline (dev.to) vs nothing (most).

### Unique ideas found only once

- **nextbase** — data access organised by authorisation level
  (`data/anon`, `data/auth`, `data/user`).
- **Klickbee** — a fixed internal shape for a feature plus a naming convention
  table. Every repo we inspected that lacked this drifted.
- **groovyweb** — an `/agents/{prompts,tools,workflows}` folder, prompts as
  typed modules rather than hardcoded strings.

## Worked example — invoicing, regrade-quotes, customers

Both options written out in full against three real domains, so the difference
is concrete rather than theoretical.

Note first that a lot is **not** in dispute. `components/ui/` for shadcn,
`lib/supabase/`, `types/database.types.ts`, and the entire `app/` route tree
are identical either way. The only question is where domain code lives.

Note also that App Router plus Supabase needs far fewer API routes than people
assume. Server Components read directly, Server Actions write. `app/api/` is
only for things that must be a real HTTP endpoint — webhooks, external callers,
file downloads, streaming.

### Layer-first — full tree

```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── customers/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   └── api/
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts
│       ├── invoices/
│       │   └── [id]/
│       │       └── pdf/
│       │           └── route.ts
│       └── quotes/
│           └── [token]/
│               └── route.ts
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── table.tsx
│   ├── shared/
│   │   ├── PageHeader.tsx
│   │   ├── EmptyState.tsx
│   │   └── DataTable.tsx
│   ├── invoicing/
│   │   ├── InvoiceTable.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceLineItems.tsx
│   │   └── InvoiceStatusBadge.tsx
│   ├── regrade-quotes/
│   │   ├── QuoteBuilder.tsx
│   │   ├── RegradeCalculator.tsx
│   │   └── QuoteSummary.tsx
│   └── customers/
│       ├── CustomerList.tsx
│       ├── CustomerDetail.tsx
│       └── CustomerForm.tsx
│
├── data/
│   ├── invoicing/
│   │   ├── labels.ts
│   │   └── statuses.ts
│   ├── regrade-quotes/
│   │   ├── labels.ts
│   │   └── gradeBands.ts
│   └── customers/
│       └── labels.ts
│
├── schemas/
│   ├── invoicing.ts
│   ├── regrade-quotes.ts
│   └── customers.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── dbCalls/
│   │   ├── invoices.ts
│   │   ├── quotes.ts
│   │   └── customers.ts
│   ├── stripe.ts
│   └── utils.ts
│
├── actions/
│   ├── invoicing.ts
│   ├── regrade-quotes.ts
│   └── customers.ts
│
├── hooks/
│   ├── useInvoiceFilters.ts
│   └── useDebounce.ts
│
└── types/
    ├── database.types.ts
    └── index.ts
```

### Feature-first — full tree

```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── customers/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   └── api/
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts     re-export from features/invoicing/api/stripeWebhook
│       ├── invoices/
│       │   └── [id]/
│       │       └── pdf/
│       │           └── route.ts re-export from features/invoicing/api/invoicePdf
│       └── quotes/
│           └── [token]/
│               └── route.ts     re-export from features/regrade-quotes/api/publicQuote
│
├── features/
│   ├── invoicing/
│   │   ├── api/
│   │   │   ├── stripeWebhook.ts
│   │   │   └── invoicePdf.ts
│   │   ├── components/
│   │   │   ├── InvoiceTable.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── InvoiceLineItems.tsx
│   │   │   └── InvoiceStatusBadge.tsx
│   │   ├── server/
│   │   │   ├── queries.ts
│   │   │   └── actions.ts
│   │   ├── schemas/
│   │   │   └── invoice.ts
│   │   ├── data/
│   │   │   ├── labels.ts
│   │   │   └── statuses.ts
│   │   ├── hooks/
│   │   │   └── useInvoiceFilters.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── regrade-quotes/
│   │   ├── api/
│   │   │   └── publicQuote.ts
│   │   ├── components/
│   │   │   ├── QuoteBuilder.tsx
│   │   │   ├── RegradeCalculator.tsx
│   │   │   └── QuoteSummary.tsx
│   │   ├── server/
│   │   │   ├── queries.ts
│   │   │   └── actions.ts
│   │   ├── schemas/
│   │   │   └── quote.ts
│   │   ├── data/
│   │   │   ├── labels.ts
│   │   │   └── gradeBands.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── customers/
│       ├── components/
│       │   ├── CustomerList.tsx
│       │   ├── CustomerDetail.tsx
│       │   └── CustomerForm.tsx
│       ├── server/
│       │   ├── queries.ts
│       │   └── actions.ts
│       ├── schemas/
│       │   └── customer.ts
│       ├── data/
│       │   └── labels.ts
│       ├── types.ts
│       └── index.ts
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── table.tsx
│   └── shared/
│       ├── PageHeader.tsx
│       ├── EmptyState.tsx
│       └── DataTable.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── stripe.ts
│   └── utils.ts
│
├── hooks/
│   └── useDebounce.ts
│
└── types/
    ├── database.types.ts
    └── index.ts
```

In feature-first the route file is a one-liner:

```ts
// app/api/webhooks/stripe/route.ts
export { POST } from '@/features/invoicing/api/stripeWebhook';
```

### The same file, both ways

| Thing          | Layer-first                            | Feature-first                                   |
| -------------- | -------------------------------------- | ----------------------------------------------- |
| Invoice form   | `components/invoicing/InvoiceForm.tsx` | `features/invoicing/components/InvoiceForm.tsx` |
| Its Zod schema | `schemas/invoicing.ts`                 | `features/invoicing/schemas/invoice.ts`         |
| Its DB write   | `actions/invoicing.ts`                 | `features/invoicing/server/actions.ts`          |
| Its DB read    | `lib/dbCalls/invoices.ts`              | `features/invoicing/server/queries.ts`          |
| Its labels     | `data/invoicing/labels.ts`             | `features/invoicing/data/labels.ts`             |
| Stripe webhook | `app/api/webhooks/stripe/route.ts`     | `features/invoicing/api/stripeWebhook.ts`       |

**Layer-first: 6 folders. Feature-first: 1 folder.**

### Three operations, compared

**Add a VAT field to invoices.**
Layer-first — edit `schemas/invoicing.ts`, `components/invoicing/InvoiceForm.tsx`,
`lib/dbCalls/invoices.ts`, `actions/invoicing.ts`, `data/invoicing/labels.ts`.
Five folders. Feature-first — `features/invoicing/`, five files, one folder.

**Client drops regrade-quotes, remove it.**
Layer-first — delete from five places and hope none were missed.
Feature-first — `rm -rf features/regrade-quotes`, fix one import in `app/`.

**Where does the regrade calculation live?**
Layer-first — `helpers/`? `lib/`? `actions/`? This is the ambiguous one, and
ambiguity is what decayed every repo examined above.
Feature-first — `features/regrade-quotes/`. Nowhere else is legal.

## Open questions

- What are the fixed folders inside a feature, and are any optional?
- Where does genuinely shared UI live, and what is the rule for promoting
  something into it?
- Do we keep `data/` for static copy, given it survived in all three repos?
- `@types/` or `types/` — every repo says `@types/`, the doc says `types/`.
- Where do Supabase clients and DB calls live, given every feature needs them?
- Does marketing versus app (subdomain split) change the top level?
- What does an agent grep for to find a thing? Structure has to be guessable
  from domain plus layer alone.

## Not yet done

- Test candidate structures against concrete scenarios: a login form, its Zod
  schema, its DB call, its copy. If two people place them differently, the
  structure is wrong.
- Confirm the chosen structure can be expressed as `eslint-plugin-boundaries`
  element types.
- Decide whether route colocation (`_components/`) is used alongside features,
  and what the promotion rule is.
- Look at shadcn/ui's expected layout — we are adopting it, and it assumes
  `components/ui/` plus `lib/utils.ts`.
- Check what `create-t3-app` and Vercel's own templates ship.

## Amar's research

<!-- Findings to be added -->

## Sources

- <https://github.com/alan2207/bulletproof-react>
- <https://github.com/arhamkhnz/next-colocation-template>
- <https://www.freecodecamp.org/news/reusable-architecture-for-large-nextjs-applications/>
- <https://www.dharmsy.com/blog/nextjs-16-app-router-folder-structure>
- App Build Guard Rails (internal PDF), Section 9
