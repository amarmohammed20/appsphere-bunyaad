'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Password input with a show/hide toggle. Never make the user guess. */
export function PasswordInput({
  name,
  autoComplete,
  invalid,
  onValueChange,
}: {
  name: string;
  autoComplete: string;
  invalid?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid}
        onChange={(event) => onValueChange?.(event.target.value)}
        className="pr-16"
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2 text-xs"
      >
        {visible ? 'Hide' : 'Show'}
      </Button>
    </div>
  );
}
