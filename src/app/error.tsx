'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Next reports only its own built-in boundaries, so an explicit one is
  // silent unless it reports itself.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="fade-up text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-zinc-400 uppercase dark:text-zinc-500">
          Something went wrong
        </p>
        <h1 className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-balance text-zinc-900 dark:text-zinc-100">
          We could not load this page.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-zinc-500 dark:text-zinc-400">
          The error has been reported. Try again, and if it keeps happening send us the reference
          below.
        </p>
        {/* Never render error.message — it can carry a query, a path or a stack. */}
        {error.digest !== undefined && (
          <p className="mt-6 font-mono text-xs text-zinc-400 dark:text-zinc-600">
            Reference {error.digest}
          </p>
        )}
      </div>

      <div className="fade-up fade-up-delay-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition duration-150 hover:bg-zinc-700 active:scale-[0.985] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-600 transition duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
