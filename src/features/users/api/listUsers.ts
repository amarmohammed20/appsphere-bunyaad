import { NextResponse } from 'next/server';

import { listUsers } from '../server/queries';

/**
 * Admin-only, like the page: the query it delegates to requires the role.
 * Rate limiting belongs here (TODO section 22).
 */
export async function GET() {
  try {
    const users = await listUsers();

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authorised') {
      return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
