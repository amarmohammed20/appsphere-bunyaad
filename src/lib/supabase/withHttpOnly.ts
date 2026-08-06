import { type CookieOptions } from '@supabase/ssr';

/** Hides a session cookie from browser JavaScript. See ./README.md. */
export function withHttpOnly(options: CookieOptions): CookieOptions {
  return { ...options, httpOnly: true };
}
