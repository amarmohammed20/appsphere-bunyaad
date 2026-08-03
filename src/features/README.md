# Features

One folder per business domain. Everything that domain needs lives inside it.

`contact/` is the reference implementation — copy its shape.

## Shape

Every feature uses the same folders. Only create the ones you need, but when you
need one, use this name rather than a synonym.

```
features/<domain>/
├── api/          HTTP handlers — only when an external caller needs a real endpoint
├── components/   UI for this domain only
├── server/       queries.ts (reads), actions.ts ('use server'), plain server functions
├── schemas/      Zod
├── data/         constants.ts, labels.ts — compile-time literals only
├── utils/        pure functions for this domain — no IO, no React
├── hooks/        client hooks used only by this domain
├── types.ts
├── index.ts      client-safe public API
└── server.ts     server-only public API
```

## Two entry points, not one

`index.ts` is client-safe: components, schemas, types, utils, labels.
`server.ts` carries `import 'server-only'` and exports queries, mutations and
actions.

They are split because a single barrel breaks the build. The moment a Client
Component imports anything from the feature, a combined barrel pulls
`server-only` into the browser bundle and the build fails. This is not
theoretical — it was reproduced before the split.

```ts
// Client Component — fine
import { contactEnquirySchema } from '@/features/contact';

// Server Component / Route Handler — fine
import { listEnquiries } from '@/features/contact/server';
```

## Rules

- **Features never import other features.** Compose them in `app/`.
- **Import a feature only through `index.ts` or `server.ts`**, never a deeper
  path. One exception: `app/api/**/route.ts` may re-export from
  `features/*/api/*`, because Next requires a file at that exact path.
- **Client Components never query Supabase.** They call a server action.
  Auth is the exception — `signIn`, `signOut` and `onAuthStateChange` run in
  the browser using `lib/supabase/client.ts`.
- **Server actions are public HTTP endpoints.** Anyone can invoke them.
  Validate every input and check the session first unless the action is
  deliberately public.
- **Keep actions and handlers thin.** Parse, authorise, delegate, revalidate.
  The write itself lives in a plain function in `server/` so the action and any
  HTTP handler share it.
- `app/` holds routing only.

## Where things go

| Thing                          | Location                               |
| ------------------------------ | -------------------------------------- |
| A form component               | `components/`                          |
| Reading from the database      | `server/queries.ts`                    |
| Writing to the database        | a plain function in `server/`          |
| A mutation a component calls   | `server/actions.ts`                    |
| Validation                     | `schemas/`                             |
| Button text, headings, options | `data/labels.ts`                       |
| Magic numbers, status lists    | `data/constants.ts`                    |
| Formatting, parsing, mapping   | `utils/`                               |
| A webhook or public endpoint   | `api/`                                 |
| A test                         | next to the file it tests, `*.test.ts` |

`data/` holds compile-time literals only. If a file in `data/` imports anything
other than a type, it is in the wrong folder.

## Outside a feature

There is no top-level `helpers/` or `utils/`. One home per concept.

| Folder               | Holds                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `components/ui/`     | shadcn primitives. Generated — do not hand-edit beyond shadcn conventions                      |
| `components/shared/` | Hand-written composites used by two or more features                                           |
| `lib/`               | Third-party wrappers, plus cross-cutting pure code with no domain meaning (`formatDate`, `cn`) |
| `hooks/`             | Hooks used by two or more features                                                             |
| `types/`             | Generated database types and types shared across features                                      |

**Shared domain code.** A schema, enum or type that two features both need goes
in `types/` if it is only types, or `lib/` if it is a pure function. If it has
real domain behaviour, it belongs to one feature and the other imports it
through that feature's barrel — that is the one place features may reference
each other, and it is a signal the boundary may be wrong.

**Page-level UI that is not a domain** — a marketing hero, a footer — goes in
`components/shared/`. Do not invent a feature for it.

## Wiring

```ts
// app/api/contact/route.ts
export { POST } from '@/features/contact/api/publicEnquiry';
```

```tsx
// app/(marketing)/contact/page.tsx
import { ContactForm } from '@/features/contact';

export default function ContactPage() {
  return <ContactForm />;
}
```
