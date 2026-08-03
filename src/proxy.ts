import { NextResponse, type NextRequest } from 'next/server';

import { isSupabaseConfigured } from '@/lib/env';
import { updateSession } from '@/lib/supabase/middleware';

// Server Components cannot write cookies, so without this the refreshed
// Supabase token is never persisted and users are signed out mid-session.
// Named proxy, not middleware: Next 16 renamed the convention.
export function proxy(request: NextRequest) {
  // No Supabase project yet — nothing to refresh.
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    // Static assets carry no session; matching them would run this per file.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
