'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { signUp } from '../actions/signUp';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import {
  Field,
  FormError,
  inputClasses,
  PasswordInput,
  PasswordStrength,
  SubmitButton,
} from './fields';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  const [password, setPassword] = useState('');

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const outcome = await signUp(formData);
      setResult(outcome);

      if (outcome.ok) {
        router.push('/');
        router.refresh();
      }
    });
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="rise-1 rise">
        <Field label={authLabels.nameField} error={fieldErrors?.fullName}>
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            autoFocus
            required
            aria-invalid={fieldErrors?.fullName !== undefined}
            className={inputClasses}
          />
        </Field>
      </div>

      <div className="rise-2 rise">
        <Field label={authLabels.emailField} error={fieldErrors?.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={fieldErrors?.email !== undefined}
            className={inputClasses}
          />
        </Field>
      </div>

      <div className="rise-3 rise flex flex-col gap-2">
        <Field label={authLabels.passwordField} error={fieldErrors?.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            invalid={fieldErrors?.password !== undefined}
            onValueChange={setPassword}
          />
        </Field>
        <PasswordStrength value={password} />
      </div>

      {result?.ok === false && <FormError message={result.error} />}

      <div className="rise-3 rise flex flex-col gap-5">
        <SubmitButton pending={isPending} pendingLabel={authLabels.signingUp}>
          {authLabels.signUp}
        </SubmitButton>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {authLabels.toSignIn}{' '}
          <Link
            href="/sign-in"
            className="font-medium text-zinc-900 transition hover:underline dark:text-zinc-100"
          >
            {authLabels.toSignInLink}
          </Link>
        </p>
      </div>
    </form>
  );
}
