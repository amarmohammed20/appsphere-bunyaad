import 'server-only';

import { createSupabaseClient, type EmailOtpType } from '@/lib/supabase/createSupabaseClient';

export async function verifyEmailToken(tokenHash: string, type: EmailOtpType): Promise<boolean> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  return error === null;
}
