'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { contactLabels } from '../data/labels';
import { contactEnquirySchema } from '../schemas/contact';
import { createEnquiry } from '../server/createEnquiry';
import { type SubmitEnquiryResult } from '../types';

/**
 * Server actions are public HTTP endpoints — anyone can invoke them. Validate
 * every input, and check the session first on anything that is not deliberately
 * public. This one is public by design.
 *
 * Keep actions thin: parse, authorise, delegate, revalidate.
 */
export async function submitEnquiry(formData: FormData): Promise<SubmitEnquiryResult> {
  const parsed = contactEnquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: contactLabels.validationFailure,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const result = await createEnquiry(parsed.data);

  if (result.ok) {
    // Correct once a page lists enquiries; /contact only shows the form.
    revalidatePath('/contact');
  }

  return result;
}
