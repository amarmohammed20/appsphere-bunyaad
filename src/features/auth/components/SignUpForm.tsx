'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { signUp } from '../actions/signUp';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field } from './Field';
import { FormError } from './FormError';
import { inputClasses } from './inputClasses';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';
import { SubmitButton } from './SubmitButton';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  const [password, setPassword] = useState('');

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const signUpResult = await signUp(formData);
      setResult(signUpResult);

      if (signUpResult.ok) {
        router.refresh();
        router.push('/');
      }
    });
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="fade-up fade-up-delay-1">
        <Field label={authLabels.nameField} error={fieldErrors?.fullName}>
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={fieldErrors?.fullName !== undefined}
            className={inputClasses}
          />
        </Field>
      </div>

      <div className="fade-up fade-up-delay-2">
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

      <div className="fade-up fade-up-delay-3 flex flex-col gap-2">
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

      <div className="fade-up fade-up-delay-3 flex flex-col gap-5">
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
