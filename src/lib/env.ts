import { z } from 'zod';

const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Full literals so Next can inline them — `process.env[key]` would not.
// `|| ''` because a blank line in .env arrives as "" and should mean unset.
const rawPublicSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// `some`, not `every`: half-configured must count as configured so validation
// below fails loudly instead of the app silently running unconfigured.
// Inlined at build time — env added only at runtime reads false in the browser.
export const isSupabaseConfigured = Object.values(rawPublicSupabaseEnv).some(Boolean);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Copy .env.example to .env.local and fill it in.');
  }
}

function parsePublicSupabaseEnv() {
  const parsed = publicSupabaseEnvSchema.safeParse(rawPublicSupabaseEnv);

  if (!parsed.success) {
    const invalid = Object.keys(z.flattenError(parsed.error).fieldErrors).join(', ');
    throw new Error(`Invalid environment variables: ${invalid}. See .env.example.`);
  }

  return parsed.data;
}

export const clientEnv = isSupabaseConfigured ? parsePublicSupabaseEnv() : rawPublicSupabaseEnv;
