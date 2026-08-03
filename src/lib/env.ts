import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Read as full literals so Next can inline them — `process.env[key]` would not.
const values = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

/** False on a fresh clone. Code that needs a database should skip, not crash. */
export const isSupabaseConfigured = Object.values(values).some(Boolean);

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
