'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Input } from '@/components/ui/input';

import { signIn } from '../actions/signIn';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field } from './Field';
import { FormError } from './FormError';
import { PasswordInput } from './PasswordInput';
import { SubmitButton } from './SubmitButton';

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const signInResult = await signIn(formData);
      setResult(signInResult);

      if (signInResult.ok) {
        // Refresh first, or the destination flashes a cached signed-out page.
        router.refresh();
        router.push(next);
      }
    });
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="fade-up fade-up-delay-1">
        <Field label={authLabels.emailField} error={fieldErrors?.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            aria-invalid={fieldErrors?.email !== undefined}
          />
        </Field>
      </div>

      <div className="fade-up fade-up-delay-2">
        <Field
          label={authLabels.passwordField}
          error={fieldErrors?.password}
          hint={
            <Link
              href="/reset-password"
              className="text-muted-foreground hover:text-foreground text-sm transition"
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

      <div className="fade-up fade-up-delay-3 flex flex-col gap-5">
        <SubmitButton pending={isPending} pendingLabel={authLabels.signingIn}>
          {authLabels.signIn}
        </SubmitButton>

        <p className="text-muted-foreground text-center text-sm">
          {authLabels.toSignUp}{' '}
          <Link href="/sign-up" className="text-foreground font-medium transition hover:underline">
            {authLabels.toSignUpLink}
          </Link>
        </p>
      </div>
    </form>
  );
}
