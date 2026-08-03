import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const raw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function parseClientEnv() {
  // Lets CI and Docker build an image without production secrets. The app
  // still fails at runtime if the values are genuinely missing.
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return {
      NEXT_PUBLIC_SUPABASE_URL: raw.NEXT_PUBLIC_SUPABASE_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    };
  }

  const parsed = clientSchema.safeParse(raw);

  if (!parsed.success) {
    const missing = Object.keys(z.flattenError(parsed.error).fieldErrors).join(', ');
    throw new Error(`Missing or invalid environment variables: ${missing}. See .env.example.`);
  }

  return parsed.data;
}

/**
 * Values safe to expose to the browser. Read as full literals so Next can
 * inline them at build time — `process.env[key]` would not work.
 */
export const clientEnv = parseClientEnv();
