export function AuthHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="fade-up">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1.5 text-sm">{lead}</p>
    </div>
  );
}
