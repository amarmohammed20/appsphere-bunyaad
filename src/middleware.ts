import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

/**
 * Refreshes the Supabase auth token on every matched request.
 *
 * Server Components cannot write cookies, so without this the refreshed token
 * is never persisted and users are silently signed out mid-session.
 */
export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and images — those never carry a session
     * and matching them would run this on every file request.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
