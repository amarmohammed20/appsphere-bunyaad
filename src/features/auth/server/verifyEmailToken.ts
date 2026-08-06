import 'server-only';

import { createClient, type EmailOtpType } from '@/lib/supabase/server';

export async function verifyEmailToken(tokenHash: string, type: EmailOtpType): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  return error === null;
}
