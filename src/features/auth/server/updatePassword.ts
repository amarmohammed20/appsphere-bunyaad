import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('updatePassword failed', { code: error.code });
    return { ok: false, error: authLabels.failure };
  }

  return { ok: true };
}
