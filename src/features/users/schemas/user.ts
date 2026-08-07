import { z } from 'zod';

export const userIdSchema = z.uuid('Not a valid user id');
