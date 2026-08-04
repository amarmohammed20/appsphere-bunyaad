import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

// Runs before every matched request — the one place for concerns that cut
// across routes: session refresh, redirects, locale, security headers.
// Each concern lives in the module that owns it and is called from here.
// Named proxy, not middleware: Next 16 renamed the convention.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Static assets carry no session; matching them would run this per file.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
