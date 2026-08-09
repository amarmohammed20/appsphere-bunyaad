import 'server-only';

import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

import { type EmailLinkType } from '../types';

export async function verifyEmailToken(tokenHash: string, type: EmailLinkType): Promise<boolean> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  return error === null;
}
