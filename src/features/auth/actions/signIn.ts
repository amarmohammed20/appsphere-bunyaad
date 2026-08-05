'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authLabels } from '../data/labels';
import { signInSchema } from '../schemas/credentials';
import { signInWithPassword } from '../server/signInWithPassword';
import { type AuthResult } from '../types';

export async function signIn(formData: FormData): Promise<AuthResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: authLabels.validationFailure,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const result = await signInWithPassword(parsed.data);

  if (result.ok) {
    // The whole layout renders differently signed in.
    revalidatePath('/', 'layout');
  }

  return result;
}
