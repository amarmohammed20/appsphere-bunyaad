// Everything here is `NEXT_PUBLIC_`, which Next inlines into the browser
// bundle at build time. Assume any value in this file is readable by anyone
// who opens devtools.
//
// A secret — the service role key, an SMTP password, a payment key — must never
// be added here, even unused: one import of `supabaseEnv` from a Client
// Component pulls the whole module into the bundle. Secrets belong in a second
// file that starts with `import 'server-only'`. Server vs client is the only
// split worth making, and it is the one the ecosystem makes too.
//
// Every service's variables live here, not beside the service that uses them.
// One file is where you look to answer "what does this app need to run", and it
// is what makes a deploy with a missing variable fail at startup rather than
// boot half-configured. Add a service as its own named group —
// `sentryEnvSchema`, `sentryEnv` — so the vendor prefix stays meaningful.

import { z } from 'zod';

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Full literals so Next can inline them — `process.env[key]` would not.
// `|| ''` because a blank line in .env arrives as "" and should mean unset.
const rawSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// `some`, not `every`: half-configured must count as configured so validation
// below fails loudly instead of the app silently running unconfigured.
// Inlined at build time — env added only at runtime reads false in the browser.
export const isSupabaseConfigured = Object.values(rawSupabaseEnv).some(Boolean);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Copy .env.example to .env.local and fill it in.');
  }
}

function parseSupabaseEnv() {
  const parsed = supabaseEnvSchema.safeParse(rawSupabaseEnv);

  if (!parsed.success) {
    const invalid = Object.keys(z.flattenError(parsed.error).fieldErrors).join(', ');
    throw new Error(`Invalid environment variables: ${invalid}. See .env.example.`);
  }

  return parsed.data;
}

// Unvalidated when Supabase is unconfigured, so a fresh clone and the env-less
// CI build still run. Every reader is behind assertSupabaseConfigured().
export const supabaseEnv = isSupabaseConfigured ? parseSupabaseEnv() : rawSupabaseEnv;
