'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { signIn } from '../actions/signIn';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field, FormError, inputClasses, PasswordInput, SubmitButton } from './fields';

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const outcome = await signIn(formData);
      setResult(outcome);

      if (outcome.ok) {
        router.push(next);
        router.refresh();
      }
    });
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

      <div className="rise-2 rise">
        <Field
          label={authLabels.passwordField}
          error={fieldErrors?.password}
          hint={
            <Link
              href="/reset-password"
              className="text-sm text-zinc-400 transition hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {authLabels.forgotPassword}
            </Link>
          }
        >
          <PasswordInput
            name="password"
            autoComplete="current-password"
            invalid={fieldErrors?.password !== undefined}
          />
        </Field>
      </div>

      {result?.ok === false && <FormError message={result.error} />}

      <div className="rise-3 rise flex flex-col gap-5">
        <SubmitButton pending={isPending} pendingLabel={authLabels.signingIn}>
          {authLabels.signIn}
        </SubmitButton>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {authLabels.toSignUp}{' '}
          <Link
            href="/sign-up"
            className="font-medium text-zinc-900 transition hover:underline dark:text-zinc-100"
          >
            {authLabels.toSignUpLink}
          </Link>
        </p>
      </div>
    </form>
  );
}
