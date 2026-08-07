import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:28px_28px]"
        />
        <div
          aria-hidden
          className="glow-pulse absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />

        <p className="relative text-sm font-semibold tracking-[0.3em] text-zinc-500 uppercase">
          Bunyaad
        </p>

        <div className="relative">
          <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight text-balance text-white">
            The foundation every project starts from.
          </h2>
          <p className="mt-4 max-w-md text-zinc-400">
            One codebase where the rules enforce themselves — so every build starts further ahead
            than the last one ended.
          </p>
        </div>

        <p className="relative text-sm text-zinc-600">
          Built by AppSphere · used by every project we ship
        </p>
      </aside>

      <section className="flex items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <p className="fade-up mb-10 text-center text-sm font-semibold tracking-[0.3em] text-zinc-400 uppercase lg:hidden dark:text-zinc-500">
            Bunyaad
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}
