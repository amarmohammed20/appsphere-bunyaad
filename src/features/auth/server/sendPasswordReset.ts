import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { type AuthResult } from '../types';

/**
 * The only place a reset email is requested. Always reports success —
 * "no account with that email" would tell an attacker which emails exist.
 * Locally the email lands in Mailpit (http://127.0.0.1:54324).
 */
export async function sendPasswordReset(email: string, redirectTo: string): Promise<AuthResult> {
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return { ok: true };
}
