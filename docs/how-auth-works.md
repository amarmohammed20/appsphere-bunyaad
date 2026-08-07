# How authentication works

Reference for the auth system in this repo: cookies, sessions, token refresh,
and why the Supabase client is built twice.

Sections are numbered so they can be referred to directly.

---

## 1. HTTP has no memory

Every HTTP request is independent. The server receives a request, sends a
response, and retains nothing about who sent it. The next request from the same
browser arrives with no connection to the previous one.

So authentication needs a way for the browser to **re-prove identity on every
single request**, without asking for the password again.

---

## 2. Cookies: the mechanism

A cookie is a key-value string stored by the browser, scoped to a domain.

**Server to browser** (response header):

```
Set-Cookie: sb-wbwtxmpy-auth-token=eyJhbGci...; Path=/; Max-Age=3600
```

**Browser to server** (request header, sent automatically on every request to
that domain):

```
Cookie: sb-wbwtxmpy-auth-token=eyJhbGci...
```

Properties that matter:

- The browser attaches them automatically. No JavaScript required.
- The server can overwrite them by sending a new `Set-Cookie`.
- They are scoped by domain and path. `app.example.com` cookies are not sent to
  `other.com`.
- Roughly 4KB per cookie, which is why `@supabase/ssr` splits large sessions
  into numbered chunks (`...auth-token.0`, `.1`).

---

## 3. What Supabase stores in the cookie

Two tokens.

### Access token

A JWT: three base64 parts separated by dots.

```
header.payload.signature
```

The payload decodes to roughly:

```json
{
  "sub": "10000000-0000-4000-8000-000000000001",
  "email": "admin@example.com",
  "role": "authenticated",
  "exp": 1785897299,
  "session_id": "c9db41da-..."
}
```

Two facts about this:

1. **Anyone can read it.** Base64 is encoding, not encryption. Paste it into
   jwt.io and the contents are visible.
2. **Nobody can forge it.** The signature is produced with the project's JWT
   secret, which only Supabase holds. Change one character of the payload and
   the signature no longer matches.

Public-readable but tamper-evident, which is what makes it safe to store
client-side.

### Refresh token

An opaque random string, not a JWT, no readable contents. Its only purpose is
to be exchanged at the Auth API for a new access token.

Together these two are **the session**.

---

## 4. Sign-in, step by step

```
1. Browser POSTs email + password to the server (Server Action `signIn`)
2. Server calls supabase.auth.signInWithPassword()
3. Supabase Auth verifies the password hash, returns { access_token, refresh_token }
4. @supabase/ssr calls our setAll() with those tokens
5. setAll() writes them onto the response as Set-Cookie headers
6. Response reaches the browser; the browser stores the cookies
7. Every subsequent request carries them automatically
```

Step 5 is only possible because a **Server Action** runs before the response
has begun streaming. That constraint is section 7.

---

## 5. Expiry and refresh

From `supabase/config.toml`:

```toml
jwt_expiry = 3600                      # access token: 1 hour
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
```

**Access token: 1 hour.** Short on purpose — if it leaks, the damage window is
bounded.

**Refresh token: no fixed expiry, but single-use.** With rotation on, every
refresh returns a new refresh token and invalidates the old one. The 10-second
reuse interval lets two simultaneous requests use the same one without
tripping the alarm.

This is a theft defence. If an attacker steals a refresh token and uses it, and
then the real user uses it too, Supabase sees the same token used twice outside
the interval and **kills the whole session**. Both are logged out — better than
the attacker having quiet indefinite access.

**Consequence:** the access token expiring is invisible to the user. The
refresh token is what actually decides how long someone stays signed in.

### How long a session lasts

```toml
[auth.sessions]
inactivity_timeout = "720h"   # 30 days
```

Two different rules, only the first of which we use:

| Setting              | Rule                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| `inactivity_timeout` | Logged out after this long **with no activity**. The clock resets on every use. |
| `timebox`            | Logged out after this long **regardless of activity**, even mid-work.           |

Without either, a session never expires — that was the case here until this was
set. 30 days of inactivity is the norm for business tools (NextAuth defaults to
30 days; Slack, Notion and GitHub are in the same range). A daily user is never
interrupted; an abandoned session dies.

`timebox` is deliberately left off. Forcing a re-login mid-work is justified for
payments or medical data, not as a template default.

Tighten per project, with the reason recorded:

| Project handles            | Suggested                                       |
| -------------------------- | ----------------------------------------------- |
| General business data      | leave at 30 days                                |
| Payments, financial        | `inactivity_timeout = "2h"`, consider a timebox |
| Health, sensitive personal | `inactivity_timeout = "30m"`                    |

**These settings are local-only until pushed.** `config.toml` configures the
local stack; the hosted project reads its auth settings from the dashboard.
Until `supabase config push` is wired into the workflow (open TODO in section
6), production keeps whatever the dashboard says — so this value has to be set
there by hand too.

---

## 6. What `getUser()` actually does

```ts
await supabase.auth.getUser();
```

Two things happen:

**a) It makes a network call.** The access token is sent to Supabase's Auth API
to be verified server-side. This is why Supabase's docs say to use `getUser()`
rather than `getSession()` on the server: `getSession()` only reads and decodes
the local cookie, so a tampered or revoked token would pass.

**b) If the access token is expired, it refreshes first.** The library uses the
refresh token, gets a new pair, and calls our `setAll()` with them.

The refresh is a **side effect** of asking who the user is. That is why the line
looks pointless and is not — delete it and nothing ever refreshes, so every
session dies at the one-hour mark.

---

## 7. The Next.js constraint

This explains every file-layout decision below.

HTTP responses are **headers first, then body**. `Set-Cookie` is a header. Once
the body starts, headers are locked.

Next.js maps that onto its execution contexts:

| Context                     | Read cookies | Write cookies | Why                               |
| --------------------------- | ------------ | ------------- | --------------------------------- |
| Middleware (`src/proxy.ts`) | yes          | yes           | Runs before any response starts   |
| Server Action               | yes          | yes           | Runs before the response is built |
| Route Handler               | yes          | yes           | Owns the whole response           |
| Server Component (a page)   | yes          | **no**        | Response is already streaming     |

Calling `cookies().set()` from a Server Component throws at runtime.

**Therefore the refresh cannot happen during page rendering.** It has to happen
in the proxy, which runs first.

---

## 8. The two clients

The SDK ships three factories. We use one of them, wrapped twice.

| File                                   | SDK factory          | Where it runs                                     |
| -------------------------------------- | -------------------- | ------------------------------------------------- |
| `lib/supabase/createSupabaseClient.ts` | `createServerClient` | Server Components, Server Actions, Route Handlers |
| `lib/supabase/refreshSession.ts`       | `createServerClient` | `src/proxy.ts`, before rendering                  |

Both call the **same** SDK function. They differ only in the cookie adapter,
because each context reaches cookies a different way — that is the entire
difference between them.

There is deliberately no browser client. `createBrowserClient` reads and writes
`document.cookie`, which requires the session cookies to be visible to
JavaScript. Nothing here needs that: every Supabase call goes through a Server
Action or a Server Component. So the cookies are written `HttpOnly` instead —
see `lib/supabase/hardenSessionCookie.ts` — and an XSS bug cannot read them.

Adding a Client Component that talks to Supabase directly means reversing that
trade. Prefer a Server Action. If a project genuinely needs the browser client
(Realtime subscriptions, direct Storage uploads), reintroducing it is a
deliberate security decision, not a convenience.

### `lib/supabase/createSupabaseClient.ts` — runs on the server, in pages and actions

```ts
const cookieStore = await cookies(); // next/headers

createServerClient(url, key, {
  cookies: {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => writeCookiesWhereAllowed(cookieStore, list),
  },
});
```

`writeCookiesWhereAllowed` is a try/catch. It exists because **the same function
is called from two contexts**:

- from `signInWithPassword` (a Server Action) — `setAll` succeeds and the
  session cookies get written
- from `queries.ts` (a page render) — `setAll` throws, and is swallowed

Swallowing is safe because the proxy already refreshed the token before the page
began rendering, so the write would have been redundant.

### `lib/supabase/refreshSession.ts` — runs in the proxy

```ts
createServerClient(url, key, {
  cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (list) => {
      request.cookies.set(...);
      response.cookies.set(...);
    },
  },
});
```

It **cannot** import `createSupabaseClient.ts`, because `next/headers` does not exist in the
middleware runtime. Middleware receives the raw `request` and builds the
`response` itself.

Note the double write in `setAll`:

- `request.cookies.set` — so the page about to render **in this same request**
  sees the fresh token
- `response.cookies.set` — so the **browser** has it for the next request

Without the first, a refresh would only take effect one request late.

`setAll` also receives a second argument, `headers`, holding
`Cache-Control: no-store` and friends. Those are copied onto the response
because a response carrying a `Set-Cookie` for one user's session must never be
cached by a CDN and replayed to another.

---

## 9. `src/proxy.ts` vs `lib/supabase/refreshSession.ts`

| File                             | What it is                                                              |
| -------------------------------- | ----------------------------------------------------------------------- |
| `src/proxy.ts`                   | The Next.js convention file. Next runs it before every matched request. |
| `lib/supabase/refreshSession.ts` | The Supabase code that does the refresh. Called by the file above.      |

These were both called `proxy.ts` until the name stopped earning its place: one
names a framework convention, the other names a job. Only the first has to be
called `proxy`.

`src/proxy.ts` is the entry point for anything that must happen before a
request is handled — session refresh today, and later redirects, locale, or
security headers. Each concern lives in its own module and is called from
there, which is why the Supabase part is a separate file.

In Next 16 this file used to be called `middleware.ts`.

**What `src/proxy.ts` does not do:** it does not decide who can see which page.
Route protection lives on the page itself (`requireAdminPage()` in
`src/app/users/page.tsx`). The proxy runs on every request including assets;
putting access rules there means a list of URL patterns that silently rots as
pages are added. On the page, the page that needs protection is the page that
declares it — and if someone forgets, the query underneath still throws and RLS
still refuses.

---

## 10. Full request lifecycle

```
Browser sends GET /users
  Cookie: sb-...-auth-token = <expired access>, <valid refresh>
        │
        ▼
src/proxy.ts                            Next runs this first
        │
        ▼
lib/supabase/refreshSession.ts -> refreshSession()
    client bound to request/response cookies
    await supabase.auth.getUser()
        -> access token expired
        -> uses refresh token, gets a new pair from the Auth API
        -> setAll(): writes to request.cookies AND response.cookies
        │
        ▼
Page renders: src/app/users/page.tsx
    requireAdminPage()
        -> getSessionUser()
            -> lib/supabase/createSupabaseClient.ts -> createClient()
            -> reads cookies via next/headers (already fresh)
            -> getUser() -> valid, no refresh needed
            -> SELECT role, full_name FROM profiles WHERE id = <sub>
        -> role is not admin -> redirect('/')
        │
        ▼
Response sent:
  Set-Cookie: sb-...-auth-token = <new access>, <new refresh>
  <html>...</html>
```

---

## 11. Edge cases

**Laptop closed for an hour — logged out?**
No. The access token is dead but the refresh token is still in the cookie. The
first request back triggers the refresh in the proxy. Nothing is visible to the
user.

**Two tabs open, both refresh at once?**
They share one cookie jar. `refresh_token_reuse_interval = 10` lets the same
refresh token be used twice within 10 seconds without triggering the theft
alarm.

**Why can the browser not decide whether the token is valid?**
It can decode `exp`, but it cannot verify the signature (no secret) and cannot
know whether the session was revoked server-side. The server calls the Auth API
on every request via `getUser()`, so revocation takes effect immediately.

**What if the proxy does not run for a request?**
The `matcher` in `src/proxy.ts` excludes static assets (`_next/static`, images).
Those never touch the database and need no session. Every request that renders a
page goes through it.

**What if someone edits the cookie in devtools?**
The signature stops matching, `getUser()` returns an error, `getSessionUser()`
returns null, and the user is treated as signed out. Even with a valid token
belonging to someone else, RLS in Postgres would only return that user's rows.

**Why store a token instead of just the user id?**
A user id in a cookie is trivially editable — change it and you are someone
else. A JWT is signed, so it cannot be edited without detection.

**Why not `localStorage` instead of cookies?**
`localStorage` is not sent with requests. The server would never see it, so
server-rendered pages could not know who the user is. Cookies are the only
browser storage the server receives automatically.

**Is `getUser()` a network call on every request? Is that slow?**
Yes, one round-trip to the Auth API per request that needs the user. That is the
price of revocation taking effect immediately. The alternative (`getSession()`,
local decode only) is faster but trusts a token that may already be revoked.

**What creates the profile row?**
Not the app. A Postgres trigger (`on_auth_user_created`) fires when a row
appears in `auth.users` and inserts the matching `public.profiles` row. That is
why sign-up needs no insert policy — the app never inserts profiles at all.

**Where does the role check actually happen?**
Three places, deliberately: the UI hides controls, the server helpers
(`requireAdmin`) return a friendly error, and RLS policies plus the
`profiles_protect_last_admin` trigger refuse the write. Only the last one is a
guarantee; the first two are ergonomics.

---

## Related files

| File                                       | Role                                            |
| ------------------------------------------ | ----------------------------------------------- |
| `src/proxy.ts`                             | Next entry point, runs before every request     |
| `src/lib/supabase/README.md`               | Why there is more than one client               |
| `src/lib/supabase/refreshSession.ts`       | Session refresh                                 |
| `src/lib/supabase/createSupabaseClient.ts` | Client for pages and Server Actions             |
| `src/lib/supabase/hardenSessionCookie.ts`  | `HttpOnly` on the session cookies               |
| `src/lib/auth/session.ts`                  | `getSessionUser`, `requireUser`, `requireAdmin` |
| `src/features/auth/`                       | Sign-in, sign-up, reset flows                   |
| `supabase/schemas/profiles.sql`            | Table, RLS policies, triggers                   |
