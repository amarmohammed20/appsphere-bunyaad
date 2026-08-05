import 'server-only';

import { redirect } from 'next/navigation';

import { getSessionUser, type SessionUser } from '@/lib/supabase/auth';

/**
 * For pages: signed out goes to sign-in and comes back here after; a member
 * goes home. Queries and writes still guard themselves — this is navigation,
 * not security.
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (user === null) {
    redirect('/sign-in?next=/users');
  }

  if (user.role !== 'admin') {
    redirect('/');
  }

  return user;
}
