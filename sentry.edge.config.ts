import * as Sentry from '@sentry/nextjs';

import {
  beforeSend,
  beforeSendTransaction,
  isSentryConfigured,
  sentryDsn,
  tracesSampleRate,
} from '@/lib/sentry/options';

// A separate runtime from the Node server. proxy.ts runs here.
Sentry.init({
  dsn: sentryDsn,
  enabled: isSentryConfigured,
  tracesSampleRate,
  beforeSend,
  beforeSendTransaction,
  sendDefaultPii: false,
  sendClientReports: false,
});
