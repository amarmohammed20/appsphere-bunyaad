import 'server-only';

import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

import { type AuthResult } from '../types';

// Always reports success — "no account with that email" would tell an
// attacker which emails exist. Locally the email lands in Mailpit (:54324).
//
// No redirectTo: the link is built by supabase/templates/recovery.html from
// `{{ .SiteURL }}`, so the destination is configuration, not a request header.
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = await createSupabaseClient();

  await supabase.auth.resetPasswordForEmail(email);

  return { ok: true };
}
