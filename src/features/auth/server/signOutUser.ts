import 'server-only';

import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

export async function signOutUser(): Promise<void> {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
}
