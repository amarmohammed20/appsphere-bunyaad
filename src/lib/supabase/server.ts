import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Re-exported so features never import the SDK directly (boundaries rule).
export { type EmailOtpType } from '@supabase/supabase-js';

import { clientEnv, assertSupabaseConfigured } from '@/lib/env';
import { type Database } from '@/types/database.types';

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
            // Server Components cannot set cookies; proxy.ts refreshes instead.
          }
        },
      },
    },
  );
}
