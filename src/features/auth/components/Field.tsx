'use client';

import { type ReactNode } from 'react';

import { FieldError } from './FieldError';

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error: string[] | undefined;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        {hint}
      </span>
      {children}
      <FieldError messages={error} />
    </label>
  );
}
