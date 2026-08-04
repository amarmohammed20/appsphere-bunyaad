import 'server-only';

import { z } from 'zod';

// Never prefix these NEXT_PUBLIC_ — that inlines them into the browser bundle.
// Every field is optional today, so nothing is actually validated yet.
const schema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // bypasses RLS
});

// A blank line in .env arrives as "", which should mean "not set" rather than
// failing min(1). Copying .env.example verbatim must not crash.
const result = schema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
});

if (!result.success) {
  const invalid = Object.keys(z.flattenError(result.error).fieldErrors).join(', ');
  throw new Error(`Invalid server environment variables: ${invalid}.`);
}

export const serverEnv = result.data;
