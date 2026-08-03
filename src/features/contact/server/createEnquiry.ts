import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { contactLabels } from '../data/labels';
import { type ContactEnquiryInput } from '../schemas/contact';
import { type SubmitEnquiryResult } from '../types';

/**
 * The only place an enquiry is written. The server action and the public HTTP
 * handler both call this, so the insert exists once.
 */
export async function createEnquiry(input: ContactEnquiryInput): Promise<SubmitEnquiryResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('contact_enquiries').insert({
    name: input.name,
    email: input.email,
    message: input.message,
    status: 'new',
  });

  if (error) {
    // Generic message to the caller; detail stays server-side.
    // Replace with the Pino logger when observability lands.
    console.error('createEnquiry failed', { code: error.code });
    return { ok: false, error: contactLabels.failure };
  }

  return { ok: true };
}
