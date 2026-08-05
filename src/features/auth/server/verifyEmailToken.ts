import 'server-only';

import { createClient, type EmailOtpType } from '@/lib/supabase/server';

/**
 * The only place an email link token becomes a session. Used by the confirm
 * endpoint for password reset (and email confirmation, once enabled).
 */
export async function verifyEmailToken(tokenHash: string, type: EmailOtpType): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  return error === null;
}
