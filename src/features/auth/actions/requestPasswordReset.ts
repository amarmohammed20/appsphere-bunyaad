'use server';

import { headers } from 'next/headers';
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

  const origin = (await headers()).get('origin') ?? '';

  return sendPasswordReset(parsed.data.email, `${origin}/auth/confirm?next=/update-password`);
}
