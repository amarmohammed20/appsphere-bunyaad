import 'server-only';

import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

import { type AuthResult } from '../types';

// Always reports success — "no account with that email" would tell an
// attacker which emails exist. Locally the email lands in Mailpit (:54324).
export async function sendPasswordReset(email: string, redirectTo: string): Promise<AuthResult> {
  const supabase = await createSupabaseClient();

  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return { ok: true };
}
