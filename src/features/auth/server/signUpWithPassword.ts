import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { authLabels } from '../data/labels';
import { type SignUpInput } from '../schemas/credentials';
import { type AuthResult } from '../types';

// The database trigger creates the profile row, always as member — roles
// are never chosen at sign-up.
export async function signUpWithPassword(input: SignUpInput): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  });

  if (error) {
    if (error.code === 'user_already_exists') {
      return { ok: false, error: authLabels.emailTaken };
    }

    console.error('signUpWithPassword failed', { code: error.code });
    return { ok: false, error: authLabels.failure };
  }

  return { ok: true };
}
