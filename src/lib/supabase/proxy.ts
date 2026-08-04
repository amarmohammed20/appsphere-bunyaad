import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { clientEnv, isSupabaseConfigured } from '@/lib/env';

// Unconfigured in production is a broken deploy, not a fresh clone. Without
// this the only symptom is users being signed out at random, with nothing in
// the logs. Module scope, so it is logged once rather than on every request.
if (!isSupabaseConfigured && process.env.NODE_ENV === 'production') {
  console.error(
    'Supabase is not configured, so sessions are never refreshed. Set ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY at build time.',
  );
}

/**
 * Refreshes the auth session on every request. Server Components cannot write
 * cookies, so the refreshed token has to be set here.
 */
export async function updateSession(request: NextRequest) {
  // No Supabase project yet — nothing to refresh.
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Do not remove — this call is what refreshes the token.
  await supabase.auth.getUser();

  return response;
}
