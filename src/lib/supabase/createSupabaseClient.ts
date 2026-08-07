import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Re-exported so features never import the SDK directly (boundaries rule).
export { type EmailOtpType } from '@supabase/supabase-js';

import { supabaseEnv, assertSupabaseConfigured } from '@/lib/env';
import { hardenSessionCookie } from '@/lib/supabase/hardenSessionCookie';
import { type Database } from '@/types/database.types';

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookiesToSet = { name: string; value: string; options: CookieOptions }[];

/** The client for Server Components, Server Actions and Route Handlers. */
export async function createSupabaseClient() {
  assertSupabaseConfigured();

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          writeCookiesWhereAllowed(cookieStore, cookiesToSet);
        },
      },
    },
  );
}

/** Succeeds in a Server Action, throws in a Server Component. See ./README.md. */
function writeCookiesWhereAllowed(store: CookieStore, cookiesToSet: CookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      store.set(name, value, hardenSessionCookie(options));
    });
  } catch {
    // Server Component. refreshSession already wrote these, so nothing is lost.
  }
}
