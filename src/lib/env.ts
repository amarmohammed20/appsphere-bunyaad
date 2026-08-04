import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Read as full literals so Next can inline them — `process.env[key]` would not.
// A blank line in .env arrives as "", which should mean "not set".
const values = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

/**
 * False on a fresh clone. Anything that opens a database connection must check
 * this first — `lib/supabase/*` throws if the URL and key are empty.
 *
 * Note these are inlined at build time, so a container built without env and
 * given env at runtime will read false in the browser bundle regardless.
 */
export const isSupabaseConfigured = Object.values(values).some(Boolean);

/** Call before opening a connection, so the error names the cause. */
export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Copy .env.example to .env.local and fill it in.');
  }
}

function validate() {
  const result = schema.safeParse(values);

  if (!result.success) {
    const invalid = Object.keys(z.flattenError(result.error).fieldErrors).join(', ');
    throw new Error(`Invalid environment variables: ${invalid}. See .env.example.`);
  }

  return result.data;
}

// Half-configured is a mistake worth failing on. Not configured at all is not.
export const clientEnv = isSupabaseConfigured ? validate() : values;
