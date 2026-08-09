import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* `dark` on the panel itself: the dark variant is class-based, so every
          token inside resolves to its dark value regardless of the user's theme.
          This panel is always dark by design, and needs no raw colours to be. */}
      <aside className="dark bg-background relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:28px_28px]"
        />
        <div
          aria-hidden
          className="glow-pulse absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />

        <p className="text-muted-foreground relative text-sm font-semibold tracking-[0.3em] uppercase">
          Bunyaad
        </p>

        <div className="relative">
          <h2 className="text-foreground max-w-md text-4xl leading-tight font-semibold tracking-tight text-balance">
            The foundation every project starts from.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md">
            One codebase where the rules enforce themselves — so every build starts further ahead
            than the last one ended.
          </p>
        </div>

        <p className="text-muted-foreground/70 relative text-sm">
          Built by AppSphere · used by every project we ship
        </p>
      </aside>

      <section className="bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <p className="fade-up text-muted-foreground mb-10 text-center text-sm font-semibold tracking-[0.3em] uppercase lg:hidden">
            Bunyaad
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}
