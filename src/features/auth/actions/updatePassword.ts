'use server';

import { z } from 'zod';

import { authLabels } from '../data/labels';
import { updatePasswordSchema } from '../schemas/credentials';
import { updatePassword as updatePasswordRecord } from '../server/updatePassword';
import { type AuthResult } from '../types';

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password') });

  if (!parsed.success) {
    return {
      ok: false,
      error: authLabels.validationFailure,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // No revalidation: a password change alters nothing any page renders.
  return await updatePasswordRecord(parsed.data.password);
}
