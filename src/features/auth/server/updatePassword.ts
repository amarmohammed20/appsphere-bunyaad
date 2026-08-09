import 'server-only';

import { reportError } from '@/lib/sentry/reportError';
import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    reportError('updatePassword failed', error, { action: 'updatePassword' });
    return { ok: false, error: authLabels.failure };
  }

  return { ok: true };
}
