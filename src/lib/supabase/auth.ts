import 'server-only';

import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type SessionRole = 'admin' | 'member';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: SessionRole;
}

/** The signed-in user with their role, or null. One query, no throwing. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // No Supabase means no accounts, so nobody is signed in. Keeps a fresh
  // clone — and the CI build, which has no env — running.
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
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

/** Call at the top of any read or write that needs a session. Reads throw. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (user === null) {
    throw new Error('Not authorised');
  }

  return user;
}

/** Call at the top of any read or write that needs a specific role. */
export async function requireRole(role: SessionRole): Promise<SessionUser> {
  const user = await requireUser();

  if (user.role !== role) {
    throw new Error('Not authorised');
  }

  return user;
}
