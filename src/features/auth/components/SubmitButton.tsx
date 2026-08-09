'use client';

import { Loader2Icon } from 'lucide-react';
import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

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
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2Icon className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
