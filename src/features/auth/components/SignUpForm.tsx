'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Input } from '@/components/ui/input';

import { signUp } from '../actions/signUp';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field } from './Field';
import { FormError } from './FormError';
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
          <Input
            name="fullName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={fieldErrors?.fullName !== undefined}
          />
        </Field>
      </div>

      <div className="fade-up fade-up-delay-2">
        <Field label={authLabels.emailField} error={fieldErrors?.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={fieldErrors?.email !== undefined}
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

        <p className="text-muted-foreground text-center text-sm">
          {authLabels.toSignIn}{' '}
          <Link href="/sign-in" className="text-foreground font-medium transition hover:underline">
            {authLabels.toSignInLink}
          </Link>
        </p>
      </div>
    </form>
  );
}
