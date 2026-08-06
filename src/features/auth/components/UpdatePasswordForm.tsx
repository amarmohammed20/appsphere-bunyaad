'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { updatePassword } from '../actions/updatePassword';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field } from './Field';
import { FormError } from './FormError';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';
import { SubmitButton } from './SubmitButton';

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  const [password, setPassword] = useState('');

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const updateResult = await updatePassword(formData);
      setResult(updateResult);

      if (updateResult.ok) {
        router.refresh();
        router.push('/');
      }
    });
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="fade-up fade-up-delay-1 flex flex-col gap-2">
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

      <div className="fade-up fade-up-delay-2">
        <SubmitButton pending={isPending} pendingLabel={authLabels.updatingPassword}>
          {authLabels.updatePassword}
        </SubmitButton>
      </div>
    </form>
  );
}
