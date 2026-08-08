import * as Sentry from '@sentry/nextjs';

import {
  beforeSend,
  beforeSendTransaction,
  isSentryConfigured,
  sentryDsn,
  tracesSampleRate,
} from '@/lib/sentry/options';

Sentry.init({
  dsn: sentryDsn,
  enabled: isSentryConfigured,
  tracesSampleRate,
  beforeSend,
  beforeSendTransaction,
  // Both default to values we do not want. Explicit so neither drifts.
  sendDefaultPii: false,
  sendClientReports: false,
});
