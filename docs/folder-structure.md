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
