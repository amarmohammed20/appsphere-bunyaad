'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authLabels } from '../data/labels';
import { signUpSchema } from '../schemas/credentials';
import { signUpWithPassword } from '../server/signUpWithPassword';
import { type AuthResult } from '../types';

export async function signUp(formData: FormData): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
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

  const result = await signUpWithPassword(parsed.data);

  if (result.ok) {
    revalidatePath('/', 'layout');
  }

  return result;
}
