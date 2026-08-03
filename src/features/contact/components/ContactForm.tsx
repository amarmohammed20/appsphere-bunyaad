'use client';

import { useState, useTransition } from 'react';

import { contactLabels } from '../data/labels';
import { submitEnquiry } from '../server/actions';
import { type SubmitEnquiryResult } from '../types';

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
          className="rounded border p-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        {contactLabels.emailField}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded border p-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        {contactLabels.messageField}
        <textarea name="message" rows={5} required className="rounded border p-2 text-base" />
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
