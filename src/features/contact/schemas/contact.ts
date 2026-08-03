import { z } from 'zod';

import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH } from '../data/constants';

export const contactEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.email('Enter a valid email address'),
  message: z
    .string()
    .trim()
    .min(MIN_MESSAGE_LENGTH, `Message must be at least ${MIN_MESSAGE_LENGTH} characters`)
    .max(MAX_MESSAGE_LENGTH, `Message must be under ${MAX_MESSAGE_LENGTH} characters`),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
