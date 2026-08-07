'use client';

import { type ReactNode } from 'react';

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-base font-medium text-white shadow-xs transition duration-150 hover:bg-zinc-700 focus-visible:ring-4 focus-visible:ring-zinc-900/20 active:scale-[0.985] disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100/30"
    >
      {pending && <Spinner />}
      {pending ? pendingLabel : children}
    </button>
  );
}
