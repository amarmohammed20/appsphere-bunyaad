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
    // Same reason as the log above: a valid session with no usable profile row
    // presents as "signed out everywhere" with nothing to search for. Returning
    // null rather than throwing keeps one broken row from taking down the app,
    // but it must not be silent.
    console.error('getSessionUser found no usable profile', {
      userId: user.id,
      profileMissing: profile === null,
      role: profile?.role,
    });

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
