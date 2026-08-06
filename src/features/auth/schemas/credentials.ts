import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '../data/constants';

const email = z.email('Enter a valid email address');
const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

export const signInSchema = z.object({ email, password });
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email,
  password,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const resetRequestSchema = z.object({ email });
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const updatePasswordSchema = z.object({ password });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
