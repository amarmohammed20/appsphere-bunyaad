import 'server-only';

import { redirect } from 'next/navigation';

import { getSessionUser, type SessionUser } from '@/lib/supabase/auth';

// Navigation, not security — queries and writes still guard themselves.
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
