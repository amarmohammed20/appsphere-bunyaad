'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { requestPasswordReset } from '../actions/requestPasswordReset';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field, FormError, inputClasses, SubmitButton } from './fields';

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setResult(await requestPasswordReset(formData));
    });
  }

  if (result?.ok === true) {
    return (
      <div className="rise flex flex-col items-center gap-4 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <svg aria-hidden viewBox="0 0 16 16" className="size-5" fill="none">
            <path
              d="M3 8.5 6.5 12 13 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="text-zinc-600 dark:text-zinc-300">{authLabels.resetSent}</p>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-zinc-900 transition hover:underline dark:text-zinc-100"
        >
          {authLabels.toSignInLink}
        </Link>
      </div>
    );
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="rise-1 rise">
        <Field label={authLabels.emailField} error={fieldErrors?.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            aria-invalid={fieldErrors?.email !== undefined}
            className={inputClasses}
          />
        </Field>
      </div>

      {result?.ok === false && <FormError message={result.error} />}

      <div className="rise-2 rise flex flex-col gap-5">
        <SubmitButton pending={isPending} pendingLabel={authLabels.sendingReset}>
          {authLabels.sendReset}
        </SubmitButton>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/sign-in" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            {authLabels.toSignInLink}
          </Link>
        </p>
      </div>
    </form>
  );
}
