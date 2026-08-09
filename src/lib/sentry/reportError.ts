import 'server-only';

import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  action?: string;
  userId?: string;
  [key: string]: string | number | boolean | null | undefined;
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'apikey', 'email'];

// `API_KEY`, `apiKey` and `api_key` must all match.
function isSensitive(key: string): boolean {
  const normalised = key.toLowerCase().replaceAll('_', '');

  return SENSITIVE_KEYS.some((sensitive) => normalised.includes(sensitive));
}

function redact(context: ErrorContext): Record<string, unknown> {
  const entries = Object.entries(context).map(([key, value]) =>
    isSensitive(key) ? [key, '[REDACTED]'] : [key, value],
  );

  return Object.fromEntries(entries);
}

// Handled failures never reach onRequestError, so they are invisible in
// Sentry unless reported here.
export function reportError(message: string, error: unknown, context: ErrorContext = {}): void {
  const redacted = redact(context);

  // Includes the error: on a clone with no DSN this is the only record left.
  console.error(message, redacted, error);

  Sentry.captureException(error, { extra: { message, ...redacted } });
}
