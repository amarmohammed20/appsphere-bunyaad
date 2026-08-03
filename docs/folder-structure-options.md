# Folder structure — the two options

Same app, both ways. Three example features: invoicing, regrade-quotes,
customers.

We are going with **feature-first**. Reasoning at the bottom.

---

## Option 1 — Group by type (layer-first)

All components in one folder, all schemas in another, and so on. A feature is
spread across six folders.

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
│   │   │   └── [id]/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── customers/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── webhooks/stripe/route.ts
│       ├── invoices/[id]/pdf/route.ts
│       └── quotes/[token]/route.ts
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

---

## Option 2 — Group by feature (what we are doing)

Everything for invoicing lives in one folder. Every feature has the same shape.

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
│   │   │   └── [id]/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── customers/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── webhooks/stripe/route.ts      one line, points at the feature
│       ├── invoices/[id]/pdf/route.ts    one line
│       └── quotes/[token]/route.ts       one line
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

Note that a lot is identical either way — `app/`, `components/ui/`,
`lib/supabase/`, `types/`. The only thing that moves is where feature code
lives.

---

## The same file, both ways

| Thing          | Group by type                          | Group by feature                                |
| -------------- | -------------------------------------- | ----------------------------------------------- |
| Invoice form   | `components/invoicing/InvoiceForm.tsx` | `features/invoicing/components/InvoiceForm.tsx` |
| Its Zod schema | `schemas/invoicing.ts`                 | `features/invoicing/schemas/invoice.ts`         |
| Its DB write   | `actions/invoicing.ts`                 | `features/invoicing/server/actions.ts`          |
| Its DB read    | `lib/dbCalls/invoices.ts`              | `features/invoicing/server/queries.ts`          |
| Its labels     | `data/invoicing/labels.ts`             | `features/invoicing/data/labels.ts`             |
| Stripe webhook | `app/api/webhooks/stripe/route.ts`     | `features/invoicing/api/stripeWebhook.ts`       |

Six folders versus one.

---

## Why we picked feature-first

**We never know how big a project will be.** Grouping by type is comfortable
while a project is small and quietly falls apart as it grows — you end up with
one folder holding forty unrelated components and no way to find anything. That
has already happened in one of our repos. Grouping by feature costs one extra
folder level and behaves identically at any size.

**Small projects stay small.** A three-page marketing site has one feature, or
none. Nothing forces you to invent structure you do not need.

**Adding or removing a feature is one folder.** When a client drops something
or we hand a project over, it is a single directory rather than six places to
hunt through.

**Fewer rules to enforce.** Grouping by feature needs three rules: features do
not import other features, features may use shared code, and routes may use
both. Grouping by type needs a decision for every pair of folders — and rules
nobody can remember are rules nobody follows.

---

## The thing that matters more than either option

Every repo we looked at — ours and other people's — had the same problem: two
folders doing the same job. Two homes for helpers, two homes for types, two
homes for components. It happened under both approaches.

So alongside this we are adding lint rules that block it. **One home per
concept, enforced automatically.** The structure choice matters less than
actually enforcing whichever one we pick.
