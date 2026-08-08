import { NextResponse, type NextRequest } from 'next/server';

import { toSafeReturnPath } from '@/lib/toSafeReturnPath';

import { EMAIL_LINK_TYPES } from '../data/constants';
import { verifyEmailToken } from '../server/verifyEmailToken';

// Where auth email links land: token in the URL becomes a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const next = toSafeReturnPath(searchParams.get('next'));
  const type = EMAIL_LINK_TYPES.find((known) => known === searchParams.get('type'));

  if (tokenHash !== null && type !== undefined && (await verifyEmailToken(tokenHash, type))) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
