# Features

One folder per business domain. Everything that domain needs lives inside it.

`users/` is the reference implementation — a full CRUD against a real table,
verified end to end. Copy its shape.

## Shape

Every feature uses the same folders. Only create the ones you need, but when you
need one, use this name rather than a synonym.

```
features/<domain>/
├── actions/      'use server' mutations — the only server code a component may import
├── api/          HTTP handlers — only when an external caller needs a real endpoint
├── components/   UI for this domain only
├── server/       queries and plain functions — never imported by client code
├── schemas/      Zod
├── data/         constants.ts, labels.ts — compile-time literals only
├── utils/        pure functions for this domain — no IO, no React
├── hooks/        client hooks used only by this domain
└── types.ts
```

`actions/` and `server/` are separate folders on purpose. A component may
import an action; it may never import a query. Keeping them apart makes that
difference something lint can check rather than something people remember.

## These rules are enforced

`eslint-plugin-boundaries` runs on every lint, configured deny-by-default in
[eslint.boundaries.mjs](../../eslint.boundaries.mjs). An import is illegal
unless a policy allows it, so breaking one of the rules below fails the build
rather than passing review.

Verified by writing deliberate violations and confirming each was caught.

## No barrel files

Import the file you want, directly:

```ts
import { UsersTable } from '@/features/users/components/UsersTable';
import { listUsers } from '@/features/users/server/listUsers';
```

Not an `index.ts` that re-exports everything. Reasons:

- The `@/` alias already gives short paths, which is the main thing barrels are
  sold on.
- Boundaries are enforced by lint on folder paths, so a barrel is not needed to
  create one.
- A single barrel exporting both browser and server code breaks the build the
  moment a Client Component imports from it — `server-only` ends up in the
  browser bundle. Reproduced before this rule existed.

Revisit if imports ever get genuinely unwieldy.

## Rules

- **Features never import other features.** Compose them in `app/`.
- **Shared components never import a feature.** `components/shared/` is
  reachable from everywhere, so an import from it into `features/` would couple
  every project to one feature's implementation. Pass the feature's component in
  as a slot instead — `AppHeader` takes `nav` and `actions` for exactly this
  reason.
- **Build on `components/ui/`, do not re-roll it.** A hand-written `<button>`
  with its own class string is a second design system.
- **Client Components never query Supabase.** They call a server action. There
  is no exception and no browser client to reach for — the session cookies are
  `HttpOnly`, so browser JavaScript cannot read them. See
  [lib/supabase/README.md](../lib/supabase/README.md).
- **Only `server/` imports the Supabase server client.** Not `components/`,
  not `api/`.
- **Server actions are public HTTP endpoints.** Anyone can invoke them.
  Validate every input and check the session first unless the action is
  deliberately public.
- **Keep actions and handlers thin.** Parse, authorise, delegate, revalidate.
  The write itself lives in a plain function in `server/` so the action and any
  HTTP handler share it.
- **Queries check authorisation themselves.** Row-level security is a second
  line of defence, not the only one. Mark each query `requires session` or
  `deliberately public` so the choice is always visible.
- `app/` holds routing only.

## Two conventions worth stating

**Reads throw, writes return a result.** A failed query throws, so it reaches
the error boundary — nothing sensible can be rendered without the data. A
failed write returns `{ ok: false, error }`, because the form needs to show it
and stay on screen. Follow the same split in every feature.

**One file per operation, named after it.** `listUsers.ts`, `updateUserRole.ts`,
`deleteUser.ts`. Reads follow the same rule as writes — a `queries.ts` grab-bag
leaves the folder with two conventions and grows until nobody can find anything.
Helpers used by one operation stay private in its file; extract them only when a
second operation needs them.

**Revalidate where data is displayed, not where it was written.** A write on
one page that only appears on another revalidates the latter.

## Where things go

| Thing                          | Location                                               |
| ------------------------------ | ------------------------------------------------------ |
| A form component               | `components/`                                          |
| Reading from the database      | a plain function in `server/`                          |
| Writing to the database        | a plain function in `server/`                          |
| A mutation a component calls   | `actions/`                                             |
| Validation                     | `schemas/`                                             |
| Button text, headings, options | `data/labels.ts`                                       |
| Magic numbers, status lists    | `data/constants.ts`                                    |
| A type derived from a constant | `types.ts`                                             |
| Formatting, parsing, mapping   | `utils/`                                               |
| A webhook or public endpoint   | `api/`                                                 |
| A test                         | next to the file it tests, `*.test.ts` (no runner yet) |

`data/` holds compile-time literals only. If a file in `data/` imports anything
other than a type, it is in the wrong folder.

**A type derived from a constant lives in `types.ts`, not beside the constant.**
The literal is runtime, the type is not, and `types.ts` is the one place to look
for a feature's types. Import the constant as a type to derive from it:

```ts
// features/auth/types.ts
import { type EMAIL_LINK_TYPES } from './data/constants';

export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];
```

## Outside a feature

There is no top-level `helpers/` or `utils/`. One home per concept.

| Folder               | Holds                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `components/ui/`     | shadcn primitives. Generated — see [its README](ui/README.md) before changing one              |
| `components/shared/` | Hand-written composites used by two or more features                                           |
| `lib/`               | Third-party wrappers, plus cross-cutting pure code with no domain meaning (`formatDate`, `cn`) |
| `hooks/`             | Hooks used by two or more features                                                             |
| `types/`             | Generated database types and types shared across features                                      |

**Shared domain code.** A schema, enum or type that two features both need goes
in `types/` if it is only types, or `lib/` if it is a pure function.

If it has real domain behaviour, first ask whether the two features are drawn
wrong — that is usually what shared business logic means. If they genuinely are
separate, the sanctioned escape is a single deliberate import with the rule
suppressed and a reason given:

```ts
// eslint-disable-next-line boundaries/dependencies -- quotes needs the invoice
// total calculation; extracting it would split one rule across two features.
import { calculateTotal } from '@/features/invoicing/utils/calculateTotal';
```

There is no policy allowing feature-to-feature imports, and there will not be
one. Every crossing should be visible in a diff with a justification attached.

**Page-level UI that is not a domain** — a marketing hero, a footer — goes in
`components/shared/`. Do not invent a feature for it.

## Wiring

```ts
// app/api/users/route.ts
export { GET } from '@/features/users/api/listUsers';
```

```tsx
// app/users/page.tsx
import { UsersTable } from '@/features/users/components/UsersTable';
import { listUsers } from '@/features/users/server/listUsers';

export default async function UsersPage() {
  const users = await listUsers();

  return <UsersTable users={users} />;
}
```
