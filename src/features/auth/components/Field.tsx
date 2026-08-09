'use client';

import { type ReactNode } from 'react';

import { Label } from '@/components/ui/label';

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
    <Label className="flex flex-col items-stretch gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        {hint}
      </span>
      {children}
      <FieldError messages={error} />
    </Label>
  );
}
