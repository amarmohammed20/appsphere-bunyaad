import * as Sentry from '@sentry/nextjs';

import {
  beforeSend,
  beforeSendTransaction,
  environment,
  isSentryConfigured,
  sentryDsn,
  tracesSampleRate,
} from '@/lib/sentry/options';

// A separate runtime from the Node server. proxy.ts runs here.
Sentry.init({
  dsn: sentryDsn,
  enabled: isSentryConfigured,
  environment,
  tracesSampleRate,
  beforeSend,
  beforeSendTransaction,
  sendDefaultPii: false,
  sendClientReports: false,
});
