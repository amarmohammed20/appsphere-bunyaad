import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { authLabels } from '../data/labels';
import { type SignInInput } from '../schemas/credentials';
import { type AuthResult } from '../types';

/** The only place a password sign-in happens. Sets the session cookies. */
export async function signInWithPassword(input: SignInInput): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    // Wrong password and unknown email get the same message on purpose —
    // anything more specific tells an attacker which emails have accounts.
    return { ok: false, error: authLabels.invalidCredentials };
  }

  return { ok: true };
}
