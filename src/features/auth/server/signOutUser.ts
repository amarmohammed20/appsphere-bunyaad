import 'server-only';

import { createClient } from '@/lib/supabase/server';

/** The only place the session is ended. Clears the cookies. */
export async function signOutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
