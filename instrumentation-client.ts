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
  sendDefaultPii: false,
  sendClientReports: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
