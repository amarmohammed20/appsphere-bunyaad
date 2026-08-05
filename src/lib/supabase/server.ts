import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// The SDK types features need, re-exported so features never import the SDK.
export { type EmailOtpType } from '@supabase/supabase-js';

import { clientEnv, assertSupabaseConfigured } from '@/lib/env';
import { type Database } from '@/types/database.types';

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export async function createClient() {
  assertSupabaseConfigured();

  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // Safe to ignore when proxy.ts is refreshing the session.
          }
        },
      },
    },
  );
}
