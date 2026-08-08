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
  sendDefaultPii: false,
  sendClientReports: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
