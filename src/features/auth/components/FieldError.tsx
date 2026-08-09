'use client';

export function FieldError({ messages }: { messages: string[] | undefined }) {
  if (messages === undefined || messages.length === 0) {
    return null;
  }

  return (
    <span role="alert" className="fade-up text-destructive text-sm">
      {messages[0]}
    </span>
  );
}
