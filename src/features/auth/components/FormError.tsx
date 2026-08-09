'use client';

export function FormError({ message }: { message: string | undefined }) {
  if (message === undefined) {
    return null;
  }

  return (
    <p
      role="alert"
      className="fade-up border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm"
    >
      {message}
    </p>
  );
}
