import * as Sentry from '@sentry/nextjs';

import {
  beforeSend,
  beforeSendTransaction,
  environment,
  isSentryConfigured,
  sentryDsn,
  tracesSampleRate,
} from '@/lib/sentry/options';

Sentry.init({
  dsn: sentryDsn,
  enabled: isSentryConfigured,
  environment,
  tracesSampleRate,
  beforeSend,
  beforeSendTransaction,
  // Both default to values we do not want. Explicit so neither drifts.
  sendDefaultPii: false,
  sendClientReports: false,
});
