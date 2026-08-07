'use server';

import { z } from 'zod';

import { authLabels } from '../data/labels';
import { resetRequestSchema } from '../schemas/credentials';
import { sendPasswordReset } from '../server/sendPasswordReset';
import { type AuthResult } from '../types';

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return {
      ok: false,
      error: authLabels.validationFailure,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // No redirect base is built here. The link is assembled by the recovery email
  // template from `{{ .SiteURL }}` — one configured value per environment,
  // rather than the request's Origin header, which is attacker-influenced in
  // principle and empty in practice for some clients.
  // Awaited rather than returned directly: a Server Action must be async, and
  // there is no other await left in this function.
  return await sendPasswordReset(parsed.data.email);
}
