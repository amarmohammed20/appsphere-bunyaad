import { createBrowserClient } from '@supabase/ssr';

import { clientEnv, assertSupabaseConfigured } from '@/lib/env';

/** Supabase client for Client Components. Runs in the browser. */
export function createClient() {
  assertSupabaseConfigured();

  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
