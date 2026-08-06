# lib/supabase

## Why is there more than one Supabase client?

Because a cookie is not reachable the same way in every part of a Next.js
request, and the Supabase client is configured by handing it a way to read and
write cookies.

The client itself is identical every time. Only the cookie access differs.

| Where your code runs                | Is a `request` object in scope? | Read cookies via  | Write cookies |
| ----------------------------------- | ------------------------------- | ----------------- | ------------- |
| `src/proxy.ts`, before rendering    | Yes, Next passes it             | `request.cookies` | Yes           |
| Server Action, Route Handler        | No                              | `cookies()`       | Yes           |
| Server Component (a page or layout) | No                              | `cookies()`       | **No**        |

Two rows have no `request` object because Next.js never gives a page one — it
exposes slices of the request through `cookies()` and `headers()` instead. See
[docs/how-auth-works.md](../../../docs/how-auth-works.md) section 8 for why.

The last row cannot write because a cookie is a `Set-Cookie` header, headers go
out before the body, and a Server Component renders while the body is already
streaming. That is a rule of HTTP, not a Next.js limitation.

## The files

| File                      | Export                    | Use it from                                       |
| ------------------------- | ------------------------- | ------------------------------------------------- |
| `createSupabaseClient.ts` | `createSupabaseClient()`  | Server Components, Server Actions, Route Handlers |
| `refreshSession.ts`       | `refreshSession(request)` | `src/proxy.ts` only — nowhere else                |
| `withHttpOnly.ts`         | `withHttpOnly(options)`   | The two files above                               |

In practice you want `createSupabaseClient.ts`. `refreshSession.ts` has exactly
one caller and you will not need to touch it.

Session and role helpers are **not** here — they are domain concepts, so they
live in [`src/lib/auth/session.ts`](../auth/session.ts). This folder holds only
the Supabase boundary.

## Why there is no browser client

`@supabase/ssr` also ships `createBrowserClient`, which reads and writes
`document.cookie`. Using it requires the session cookies to be visible to
JavaScript, which means an XSS bug can steal a live session.

Nothing here needs it. Every Supabase call goes through a Server Action or a
Server Component, so the cookies are written `HttpOnly` and the browser refuses
to expose them to JavaScript at all.

Need Realtime subscriptions or direct Storage uploads in a future project? Those
genuinely require the browser client. Adding it back means dropping `HttpOnly`
in `withHttpOnly.ts` — a deliberate security decision, made once, in writing.
For everything else, use a Server Action.

## Why `createSupabaseClient.ts` swallows an error

`createSupabaseClient()` serves three contexts, and one of them cannot write cookies.
Rather than three near-identical clients, `writeCookiesWhereAllowed` attempts the
write and ignores the failure.

That is safe, not sloppy: `refreshSession.ts` already wrote the current session
from `src/proxy.ts` before rendering began, so the write a Server Component
attempts is redundant — never lost.
