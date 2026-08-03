import { NextResponse, type NextRequest } from 'next/server';

import { contactEnquirySchema } from '../schemas/contact';
import { createEnquiry } from '../server/createEnquiry';

/**
 * Real HTTP endpoint, for callers outside the app — an embedded form on a
 * client's existing site, for example. Anything inside the app should call the
 * server action instead.
 *
 * Wired up in app/api/contact/route.ts. Keep handlers thin: parse, delegate,
 * map to a status code.
 */
export async function POST(request: NextRequest) {
  const parsed = contactEnquirySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const result = await createEnquiry(parsed.data);

  return result.ok
    ? NextResponse.json({ ok: true }, { status: 201 })
    : NextResponse.json({ error: result.error }, { status: 500 });
}
