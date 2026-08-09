import 'server-only';

import * as Sentry from '@sentry/nextjs';

import { isSupabaseConfigured } from '@/lib/env';
import { reportError } from '@/lib/sentry/reportError';
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
      reportError('getSessionUser auth failure', error, { action: 'getSessionUser' });
    }

    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile === null || (profile.role !== 'admin' && profile.role !== 'member')) {
    // A valid session with no usable profile row looks like "signed out
    // everywhere" to the user, and like nothing at all in the logs.
    reportError('getSessionUser found no usable profile', new Error('No usable profile'), {
      action: 'getSessionUser',
      userId: user.id,
      profileMissing: profile === null,
      role: profile?.role,
    });

    return null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email ?? '',
    fullName: profile.full_name,
    role: profile.role,
  };

  // Id and role only: an email here is personal data held by a third party,
  // and debugging never needs it.
  Sentry.setUser({ id: sessionUser.id, role: sessionUser.role });

  return sessionUser;
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
