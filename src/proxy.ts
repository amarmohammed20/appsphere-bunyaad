import { type NextRequest } from 'next/server';

import { refreshSession } from '@/lib/supabase/refreshSession';

// The one place for cross-route concerns (session refresh, redirects,
// headers); each lives in its owning module and is called from here.
// Named proxy, not middleware: Next 16 renamed the convention.
export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  matcher: [
    // Static assets carry no session; matching them would run this per file.
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
