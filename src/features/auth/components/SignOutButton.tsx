'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { signOut } from '../actions/signOut';
import { authLabels } from '../data/labels';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button variant="outline" disabled={isPending} onClick={() => startTransition(() => signOut())}>
      {authLabels.signOut}
    </Button>
  );
}
