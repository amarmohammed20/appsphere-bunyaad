import { NextResponse, type NextRequest } from 'next/server';

import { verifyEmailToken } from '../server/verifyEmailToken';

const EMAIL_OTP_TYPES = ['recovery', 'signup', 'email_change', 'invite', 'email'] as const;

/**
 * Where the links in auth emails land. Turns the token in the URL into a
 * session, then continues to `next` — the update-password page for resets.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const rawNext = searchParams.get('next') ?? '/';
  // Relative paths only, so a crafted email link cannot bounce the fresh
  // session to another site.
  const next = rawNext.startsWith('/') ? rawNext : '/';
  const type = EMAIL_OTP_TYPES.find((known) => known === searchParams.get('type'));

  if (tokenHash !== null && type !== undefined && (await verifyEmailToken(tokenHash, type))) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
