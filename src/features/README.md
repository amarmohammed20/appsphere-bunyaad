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
└── types.ts
```

## No barrel files

Import the file you want, directly:

```ts
import { ContactForm } from '@/features/contact/components/ContactForm';
import { listEnquiries } from '@/features/contact/server/queries';
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
- **Client Components never query Supabase.** They call a server action.
  Auth is the exception — `signIn`, `signOut` and `onAuthStateChange` run in
  the browser using `lib/supabase/client.ts`.
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

**One file per write, named after the verb.** `createEnquiry.ts`,
`cancelInvoice.ts`. Reads are grouped in `queries.ts` because they share
shape; writes are not, because each one owns its own rules and gets called from
more than one place.

**Revalidate where data is displayed, not where it was written.** A write on
`/contact` that only appears on `/admin/enquiries` revalidates the latter.

## Where things go

| Thing                          | Location                                               |
| ------------------------------ | ------------------------------------------------------ |
| A form component               | `components/`                                          |
| Reading from the database      | `server/queries.ts`                                    |
| Writing to the database        | a plain function in `server/`                          |
| A mutation a component calls   | `server/actions.ts`                                    |
| Validation                     | `schemas/`                                             |
| Button text, headings, options | `data/labels.ts`                                       |
| Magic numbers, status lists    | `data/constants.ts`                                    |
| Formatting, parsing, mapping   | `utils/`                                               |
| A webhook or public endpoint   | `api/`                                                 |
| A test                         | next to the file it tests, `*.test.ts` (no runner yet) |

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
directly — that is the one place features may reference each other, and it is a
signal the boundary may be wrong.

**Page-level UI that is not a domain** — a marketing hero, a footer — goes in
`components/shared/`. Do not invent a feature for it.

## Wiring

```ts
// app/api/contact/route.ts
export { POST } from '@/features/contact/api/publicEnquiry';
```

```tsx
// app/(marketing)/contact/page.tsx
import { ContactForm } from '@/features/contact/components/ContactForm';

export default function ContactPage() {
  return <ContactForm />;
}
```
