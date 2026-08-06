'use client';

import { useState } from 'react';

import { inputClasses } from './inputClasses';

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
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid}
        onChange={(event) => onValueChange?.(event.target.value)}
        className={`${inputClasses} pr-16`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-zinc-400 transition hover:text-zinc-900 focus-visible:text-zinc-900 dark:hover:text-zinc-100 dark:focus-visible:text-zinc-100"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
