'use client';

export function FormError({ message }: { message: string | undefined }) {
  if (message === undefined) {
    return null;
  }

  return (
    <p
      role="alert"
      className="fade-up rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
    >
      {message}
    </p>
  );
}
