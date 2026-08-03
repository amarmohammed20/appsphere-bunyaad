import 'server-only';

import { z } from 'zod';

/**
 * Server-only environment variables. Never prefix these with NEXT_PUBLIC_ —
 * that inlines them into the browser bundle.
 *
 * `server-only` above makes importing this from a Client Component a build
 * error, so a secret cannot reach the browser by accident.
 */
const serverSchema = z.object({
  // Bypasses row-level security. Only use it where RLS genuinely cannot work.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const raw = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function parseServerEnv() {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return raw;
  }

  const parsed = serverSchema.safeParse(raw);

  if (!parsed.success) {
    const missing = Object.keys(z.flattenError(parsed.error).fieldErrors).join(', ');
    throw new Error(`Missing or invalid server environment variables: ${missing}.`);
  }

  return parsed.data;
}

export const serverEnv = parseServerEnv();
