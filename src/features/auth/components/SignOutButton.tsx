'use client';

import { useTransition } from 'react';

import { signOut } from '../actions/signOut';
import { authLabels } from '../data/labels';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
    >
      {authLabels.signOut}
    </button>
  );
}
