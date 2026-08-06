import 'server-only';

import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

export type SessionRole = 'admin' | 'member';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: SessionRole;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // Unconfigured means no accounts exist — keeps a fresh clone and the
  // env-less CI build running instead of throwing.
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user === null) {
    // A wrong anon key would otherwise present as everyone quietly signed out.
    if (error !== null && error.name !== 'AuthSessionMissingError') {
      console.error('getSessionUser auth failure', { code: error.code, name: error.name });
    }

    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile === null || (profile.role !== 'admin' && profile.role !== 'member')) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile.full_name,
    role: profile.role,
  };
}

/** Signed in as anyone. Throws when nobody is signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (user === null) {
    throw new Error('Not signed in');
  }

  return user;
}

/** Signed in as an admin. Throws separately for signed-out and wrong-role. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== 'admin') {
    throw new Error('Requires the admin role');
  }

  return user;
}
