export type AuthResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
