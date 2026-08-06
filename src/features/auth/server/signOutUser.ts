import 'server-only';

import { createClient } from '@/lib/supabase/server';

export async function signOutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
