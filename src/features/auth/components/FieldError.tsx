'use client';

export function FieldError({ messages }: { messages: string[] | undefined }) {
  if (messages === undefined || messages.length === 0) {
    return null;
  }

  return (
    <span role="alert" className="fade-up text-sm text-red-600 dark:text-red-400">
      {messages[0]}
    </span>
  );
}
