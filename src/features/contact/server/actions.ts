'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

import { contactEnquirySchema } from '../schemas/contact';
import { type SubmitEnquiryResult } from '../types';

/** Writes. Called from Client Components; never call Supabase from the client. */

export async function submitEnquiry(formData: FormData): Promise<SubmitEnquiryResult> {
  const parsed = contactEnquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please check the form and try again.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('contact_enquiries').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    status: 'new',
  });

  if (error) {
    // Generic message to the client; the real error goes to the logger.
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  revalidatePath('/contact');
  return { ok: true };
}
