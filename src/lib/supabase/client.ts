import { createBrowserClient } from '@supabase/ssr';

import { clientEnv, assertSupabaseConfigured } from '@/lib/env';
import { type Database } from '@/types/database.types';

export function createClient() {
  assertSupabaseConfigured();

  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
