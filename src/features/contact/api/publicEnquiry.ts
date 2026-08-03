import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { contactEnquirySchema } from '../schemas/contact';

/**
 * Real HTTP endpoint, for callers outside the app — an embedded form on a
 * client's existing site, for example. Anything inside the app should use the
 * server action instead.
 *
 * Wired up in app/api/contact/route.ts.
 */
export async function POST(request: NextRequest) {
  const parsed = contactEnquirySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('contact_enquiries').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    status: 'new',
  });

  if (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
