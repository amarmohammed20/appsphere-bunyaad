import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { clientEnv, isSupabaseConfigured } from '@/lib/env';
import { hardenSessionCookie } from '@/lib/supabase/hardenSessionCookie';
import { type Database } from '@/types/database.types';

// In production, unconfigured is a broken deploy — without this line its only
// symptom is users signed out at random. Module scope: logged once.
if (!isSupabaseConfigured && process.env.NODE_ENV === 'production') {
  console.error(
    'Supabase is not configured, so sessions are never refreshed. Set ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY at build time.',
  );
}

/**
 * Refreshes an expiring access token and writes the new session onto the
 * response. Runs from `src/proxy.ts`, the only point in a request where writing
 * a cookie is still legal. See ./README.md.
 */
export async function refreshSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, hardenSessionCookie(options));
          });

          // no-store/no-cache. A response carrying a Set-Cookie for one user's
          // session must never be cached by a CDN and replayed to another.
          Object.entries(headers).forEach(([key, headerValue]) => {
            response.headers.set(key, headerValue);
          });
        },
      },
    },
  );

  // Do not remove — this call is what refreshes the token.
  await supabase.auth.getUser();

  return response;
}
