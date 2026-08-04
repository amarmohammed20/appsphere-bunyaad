'use client';

import { useState, useTransition } from 'react';

import { submitEnquiry } from '../actions/submitEnquiry';
import { contactLabels } from '../data/labels';
import { type SubmitEnquiryResult } from '../types';

function FieldError({ messages }: { messages: string[] | undefined }) {
  if (messages === undefined || messages.length === 0) {
    return null;
  }

  return (
    <span role="alert" className="text-sm text-red-600">
      {messages[0]}
    </span>
  );
}

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitEnquiryResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setResult(await submitEnquiry(formData));
    });
  }

  if (result?.ok === true) {
    return <p>{contactLabels.success}</p>;
  }

  const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{contactLabels.heading}</h2>

      <label className="flex flex-col gap-1">
        {contactLabels.nameField}
        <input
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={fieldErrors?.name !== undefined}
          className="rounded border p-2 text-base"
        />
        <FieldError messages={fieldErrors?.name} />
      </label>

      <label className="flex flex-col gap-1">
        {contactLabels.emailField}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={fieldErrors?.email !== undefined}
          className="rounded border p-2 text-base"
        />
        <FieldError messages={fieldErrors?.email} />
      </label>

      <label className="flex flex-col gap-1">
        {contactLabels.messageField}
        <textarea
          name="message"
          rows={5}
          required
          aria-invalid={fieldErrors?.message !== undefined}
          className="rounded border p-2 text-base"
        />
        <FieldError messages={fieldErrors?.message} />
      </label>

      {result?.ok === false && <p role="alert">{result.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 rounded bg-black px-4 text-white"
      >
        {isPending ? contactLabels.submitting : contactLabels.submit}
      </button>
    </form>
  );
}
