import { NextResponse, type NextRequest } from 'next/server';

import { toSafeReturnPath } from '@/lib/returnPath';

import { verifyEmailToken } from '../server/verifyEmailToken';

// Every accepted type is a way to mint a session — widen only when a flow
// that needs another type is actually enabled.
const EMAIL_OTP_TYPES = ['recovery'] as const;

// Where auth email links land: token in the URL becomes a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const next = toSafeReturnPath(searchParams.get('next'));
  const type = EMAIL_OTP_TYPES.find((known) => known === searchParams.get('type'));

  if (tokenHash !== null && type !== undefined && (await verifyEmailToken(tokenHash, type))) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
