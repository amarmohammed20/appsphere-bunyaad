'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function Error({
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
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <div className="fade-up text-center">
        <p className="text-muted-foreground text-sm font-semibold tracking-[0.3em] uppercase">
          Something went wrong
        </p>
        <h1 className="text-foreground mt-4 max-w-lg text-3xl font-semibold tracking-tight text-balance">
          We could not load this page.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md">
          The error has been reported. Try again, and if it keeps happening send us the reference
          below.
        </p>
        {/* Never render error.message — it can carry a query, a path or a stack. */}
        {error.digest !== undefined && (
          <p className="text-muted-foreground mt-6 font-mono text-xs">Reference {error.digest}</p>
        )}
      </div>

      <div className="fade-up fade-up-delay-2 flex items-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
