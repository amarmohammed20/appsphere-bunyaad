'use client';

import { CheckIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Input } from '@/components/ui/input';

import { requestPasswordReset } from '../actions/requestPasswordReset';
import { authLabels } from '../data/labels';
import { type AuthResult } from '../types';

import { Field } from './Field';
import { FormError } from './FormError';
import { SubmitButton } from './SubmitButton';

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
      <div className="fade-up flex flex-col items-center gap-4 text-center">
        {/* Raw colours: the theme has no success token. Add one before
            reaching for emerald anywhere else. */}
        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckIcon aria-hidden className="size-5" />
        </span>
        <p className="text-muted-foreground">{authLabels.resetSent}</p>
        <Link
          href="/sign-in"
          className="text-foreground text-sm font-medium transition hover:underline"
        >
          {authLabels.toSignInLink}
        </Link>
      </div>
    );
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
            required
            aria-invalid={fieldErrors?.email !== undefined}
          />
        </Field>
      </div>

      {result?.ok === false && <FormError message={result.error} />}

      <div className="fade-up fade-up-delay-2 flex flex-col gap-5">
        <SubmitButton pending={isPending} pendingLabel={authLabels.sendingReset}>
          {authLabels.sendReset}
        </SubmitButton>

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/sign-in" className="hover:text-foreground transition">
            {authLabels.toSignInLink}
          </Link>
        </p>
      </div>
    </form>
  );
}
