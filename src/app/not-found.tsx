import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <div className="fade-up text-center">
        <p className="text-muted-foreground text-sm font-semibold tracking-[0.3em] uppercase">
          404
        </p>
        <h1 className="text-foreground mt-4 max-w-lg text-3xl font-semibold tracking-tight text-balance">
          This page does not exist.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md">
          The link may be out of date, or the page may have moved.
        </p>
      </div>

      <Button asChild className="fade-up fade-up-delay-2">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
