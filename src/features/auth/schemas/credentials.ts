import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '../data/constants';

const email = z.email('Enter a valid email address');
const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

export const signInSchema = z.object({ email, password });
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  // max mirrors the check constraint on profiles.full_name. The app is not the
  // only writer — signup is open over REST with the anon key, and the trigger
  // copies raw_user_meta_data verbatim — so the database bound is the real one.
  fullName: z.string().trim().min(2, 'Enter your full name').max(100, 'Name is too long'),
  email,
  password,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const resetRequestSchema = z.object({ email });
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const updatePasswordSchema = z.object({ password });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
