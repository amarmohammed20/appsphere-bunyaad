import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="fade-up text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-zinc-400 uppercase dark:text-zinc-500">
          404
        </p>
        <h1 className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-balance text-zinc-900 dark:text-zinc-100">
          This page does not exist.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-zinc-500 dark:text-zinc-400">
          The link may be out of date, or the page may have moved.
        </p>
      </div>

      <Link
        href="/"
        className="fade-up fade-up-delay-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition duration-150 hover:bg-zinc-700 active:scale-[0.985] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Go home
      </Link>
    </main>
  );
}
