'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { ThemeProvider } from '@/components/shared/ThemeProvider';

// Replaces the root layout, so it brings its own html, body and stylesheet.
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // A digest means the server already reported this through onRequestError;
  // capturing again would file every server error twice.
  useEffect(() => {
    if (error.digest === undefined) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    // This file replaces the root layout, so it does not inherit its
    // ThemeProvider. Without one, nothing sets `.dark` and every token here
    // resolves to the light values — a dark-OS user would get a white flash on
    // the worst failure the app can have.
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
        <ThemeProvider>
          <div>
            <h1 className="text-foreground max-w-lg text-3xl font-semibold tracking-tight text-balance">
              The application failed to load.
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-md">
              This has been reported. Reload the page, and if it keeps happening send us the
              reference below.
            </p>
            {error.digest !== undefined && (
              <p className="text-muted-foreground mt-6 font-mono text-xs">
                Reference {error.digest}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium shadow-xs transition duration-150 active:scale-[0.985]"
          >
            Reload
          </button>
        </ThemeProvider>
      </body>
    </html>
  );
}
