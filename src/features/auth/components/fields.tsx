'use client';

import { useState, type ReactNode } from 'react';

export function FieldError({ messages }: { messages: string[] | undefined }) {
  if (messages === undefined || messages.length === 0) {
    return null;
  }

  return (
    <span role="alert" className="rise text-sm text-red-600 dark:text-red-400">
      {messages[0]}
    </span>
  );
}

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

export const inputClasses =
  'h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 shadow-xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/8 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10';

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

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'] as const;

function scorePassword(value: string): number {
  if (value.length < 8) {
    return 0;
  }

  let score = 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;

  return score;
}

/** Four quiet segments. Confidence, not a lecture. */
export function PasswordStrength({ value }: { value: string }) {
  if (value.length === 0) {
    return null;
  }

  const score = scorePassword(value);

  let filledColor = 'bg-emerald-500';
  if (score <= 1) {
    filledColor = 'bg-red-400';
  } else if (score === 2) {
    filledColor = 'bg-amber-400';
  }

  return (
    <div className="rise flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              score >= segment ? filledColor : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}

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

export function FormError({ message }: { message: string | undefined }) {
  if (message === undefined) {
    return null;
  }

  return (
    <p
      role="alert"
      className="rise rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
    >
      {message}
    </p>
  );
}

export function AuthHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="rise">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{lead}</p>
    </div>
  );
}
