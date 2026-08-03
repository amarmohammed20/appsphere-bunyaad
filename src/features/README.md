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
├── server/       queries.ts (reads) and actions.ts (writes)
├── schemas/      Zod
├── data/         constants.ts, labels.ts — static values, no logic
├── utils/        pure functions for this domain — no IO, no React
├── hooks/        client hooks used only by this domain
├── types.ts
└── index.ts      the feature's public API
```

## Rules

- **Features never import other features.** Compose them in `app/`.
- **Import a feature only through its `index.ts`**, never a path inside it.
- Anything needed by two or more features moves to `components/`, `hooks/` or
  `lib/`.
- `lib/` is for wrapping third-party libraries. If it is our logic, it belongs
  in a feature.
- Client Components never call Supabase. They call a server action.
- `app/` holds routing only — pages import from a feature, route handlers
  re-export from one.

## Where things go

| Thing                          | Location            |
| ------------------------------ | ------------------- |
| A form component               | `components/`       |
| Reading from the database      | `server/queries.ts` |
| Writing to the database        | `server/actions.ts` |
| Validation                     | `schemas/`          |
| Button text, headings, options | `data/labels.ts`    |
| Magic numbers, status lists    | `data/constants.ts` |
| Formatting, parsing, mapping   | `utils/`            |
| A webhook or public endpoint   | `api/`              |

## Wiring a route handler

The feature owns the handler; `app/` only wires the URL.

```ts
// app/api/contact/route.ts
export { POST } from '@/features/contact/api/publicEnquiry';
```

## Wiring a page

```tsx
// app/(marketing)/contact/page.tsx
import { ContactForm } from '@/features/contact';

export default function ContactPage() {
  return <ContactForm />;
}
```
