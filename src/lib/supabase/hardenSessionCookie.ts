import { type CookieOptions } from '@supabase/ssr';

// @supabase/ssr's DEFAULT_COOKIE_OPTIONS is
// `{ path, sameSite: 'lax', httpOnly: false, maxAge }` — it sets neither of
// these, so both have to be added at every write site. See ./README.md.
//
// httpOnly: browser JavaScript cannot read the cookie, so XSS cannot steal a
//   session. Possible only because nothing here uses a browser Supabase client.
// secure: the browser refuses to send it over plain http. Without it, one
//   http:// request to the production domain — a first visit before HSTS has
//   been seen, or a subdomain fetch — leaks the session in cleartext.
//   Conditioned on production so local http development still signs in.
export function hardenSessionCookie(options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };
}
