/** Writes return a result; the form shows it and stays on screen. */
export type MutationResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
