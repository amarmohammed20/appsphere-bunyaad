'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

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
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-zinc-50 px-4 text-center dark:bg-zinc-950">
        <div>
          <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-balance text-zinc-900 dark:text-zinc-100">
            The application failed to load.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-zinc-500 dark:text-zinc-400">
            This has been reported. Reload the page, and if it keeps happening send us the reference
            below.
          </p>
          {error.digest !== undefined && (
            <p className="mt-6 font-mono text-xs text-zinc-400 dark:text-zinc-600">
              Reference {error.digest}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition duration-150 hover:bg-zinc-700 active:scale-[0.985] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
