import type { ErrorEvent, Event, EventHint } from '@sentry/nextjs';

export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Unconfigured is silent, not broken — a fresh clone has no Sentry account.
export const isSentryConfigured = Boolean(sentryDsn);

// Traces are billed per event; errors are not.
export const tracesSampleRate = process.env.NODE_ENV === 'development' ? 1 : 0.1;

const SENSITIVE_HEADERS = ['authorization', 'cookie'];

// Next 16 throws the second; @sentry/nextjs checks both in its own helper.
const NOT_FOUND_DIGESTS = ['NEXT_NOT_FOUND', 'NEXT_HTTP_ERROR_FALLBACK;404'];

function hasDigest(value: unknown): value is { digest?: unknown } {
  return typeof value === 'object' && value !== null && 'digest' in value;
}

// notFound() throws internally, so without this every 404 becomes an issue.
function isNextNotFound(hint: EventHint): boolean {
  const { originalException } = hint;

  return (
    hasDigest(originalException) &&
    typeof originalException.digest === 'string' &&
    NOT_FOUND_DIGESTS.includes(originalException.digest)
  );
}

function withoutHeaders(headers: Record<string, string>): Record<string, string> {
  const kept = Object.entries(headers).filter(
    ([name]) => !SENSITIVE_HEADERS.includes(name.toLowerCase()),
  );

  return Object.fromEntries(kept);
}

// `?token_hash=` on /auth/confirm is a live sign-in token, and sendDefaultPii
// does not cover the query string.
function withoutQuery(url: string): string {
  return url.split('?')[0] ?? url;
}

function scrubbedNextjsContext(context: Record<string, unknown>): Record<string, unknown> {
  const requestPath = context.request_path;

  if (typeof requestPath !== 'string') {
    return context;
  }

  return { ...context, request_path: withoutQuery(requestPath) };
}

// A transaction carries the URL again in contexts.trace.data and in every
// span, built from raw OpenTelemetry attributes. `http.query` is the bare
// query string, so it has to go rather than be de-queried.
function scrubbedSpanData(data: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(data)
    .filter(([key]) => key !== 'http.query')
    .map(([key, value]) => [key, typeof value === 'string' ? withoutQuery(value) : value]);

  return Object.fromEntries(entries);
}

function scrub<T extends Event>(event: T): T {
  const request = event.request && {
    ...event.request,
    ...(typeof event.request.url === 'string' ? { url: withoutQuery(event.request.url) } : {}),
    ...(event.request.headers ? { headers: withoutHeaders(event.request.headers) } : {}),
    query_string: undefined,
  };

  const nextjs = event.contexts?.nextjs && scrubbedNextjsContext(event.contexts.nextjs);
  const trace = event.contexts?.trace;
  const scrubbedTrace = trace?.data && { ...trace, data: scrubbedSpanData(trace.data) };

  const contexts =
    nextjs || scrubbedTrace
      ? {
          ...event.contexts,
          ...(nextjs ? { nextjs } : {}),
          ...(scrubbedTrace ? { trace: scrubbedTrace } : {}),
        }
      : undefined;

  const spans = event.spans?.map((span) =>
    span.data ? { ...span, data: scrubbedSpanData(span.data) } : span,
  );

  return {
    ...event,
    ...(request ? { request } : {}),
    ...(contexts ? { contexts } : {}),
    ...(spans ? { spans } : {}),
  };
}

export function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  return isNextNotFound(hint) ? null : scrub(event);
}

// Transactions bypass beforeSend, so a sampled request would carry the URL
// unscrubbed. Generic because the SDK's TransactionEvent type is not exported.
export function beforeSendTransaction<T extends Event>(event: T): T {
  return scrub(event);
}
