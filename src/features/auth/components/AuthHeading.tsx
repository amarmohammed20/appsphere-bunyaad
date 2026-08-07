export function AuthHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="fade-up">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{lead}</p>
    </div>
  );
}
