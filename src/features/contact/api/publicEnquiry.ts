import { NextResponse, type NextRequest } from 'next/server';

import { contactEnquirySchema } from '../schemas/contact';
import { createEnquiry } from '../server/createEnquiry';

/**
 * Public, unauthenticated endpoint for callers outside the app — an embedded
 * form on a client's existing site. Code inside the app calls the server
 * action instead. Rate limiting belongs here (TODO section 22).
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = contactEnquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const result = await createEnquiry(parsed.data);

  return result.ok
    ? NextResponse.json({ ok: true }, { status: 201 })
    : NextResponse.json({ error: result.error }, { status: 500 });
}
