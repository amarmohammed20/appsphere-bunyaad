'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { updatePassword } from '../actions/updatePassword';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field, FormError, PasswordInput, PasswordStrength, SubmitButton } from './fields';

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  const [password, setPassword] = useState('');

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const outcome = await updatePassword(formData);
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
      <div className="rise-1 rise flex flex-col gap-2">
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

      <div className="rise-2 rise">
        <SubmitButton pending={isPending} pendingLabel={authLabels.updatingPassword}>
          {authLabels.updatePassword}
        </SubmitButton>
      </div>
    </form>
  );
}
