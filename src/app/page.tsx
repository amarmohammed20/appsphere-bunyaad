import Link from 'next/link';

import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { getSessionUser, type SessionUser } from '@/features/auth/server/session';

function greetingFor(hour: number): string {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function SignedOutHome() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 overflow-hidden bg-zinc-50 px-4 dark:bg-zinc-950">
      <div
        aria-hidden
        className="breathe absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-zinc-200/60 blur-3xl dark:bg-zinc-800/40"
      />

      <div className="rise relative text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-zinc-400 uppercase dark:text-zinc-500">
          Bunyaad
        </p>
        <h1 className="mt-4 max-w-lg text-4xl font-semibold tracking-tight text-balance text-zinc-900 dark:text-zinc-100">
          The foundation every project starts from.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-zinc-500 dark:text-zinc-400">
          One codebase where the rules enforce themselves.
        </p>
      </div>

      <div className="rise-2 rise relative flex items-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition duration-150 hover:bg-zinc-700 active:scale-[0.985] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition duration-150 hover:border-zinc-900 hover:text-zinc-900 active:scale-[0.985] dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition duration-150 hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <p className="flex items-center justify-between font-medium text-zinc-900 dark:text-zinc-100">
        {title}
        <span
          aria-hidden
          className="text-zinc-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600"
        >
          →
        </span>
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </Link>
  );
}

function SignedInHome({ user }: { user: SessionUser }) {
  const firstName = user.fullName.split(' ')[0];
  const greeting = greetingFor(new Date().getHours());

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-4 py-14">
      <header className="rise flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as {user.email} · <span className="capitalize">{user.role}</span>
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="rise-2 rise grid gap-3 sm:grid-cols-2">
        {user.role === 'admin' ? (
          <ActionCard
            href="/users"
            title="Manage the team"
            description="Roles, access, and who belongs here."
          />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 p-5 dark:border-zinc-800">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">You&apos;re a member</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              An admin can promote you from the team page.
            </p>
          </div>
        )}
        <div className="rounded-xl border border-dashed border-zinc-200 p-5 dark:border-zinc-800">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Build something</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            This is the boilerplate&apos;s starting point — your first feature replaces this card.
          </p>
        </div>
      </section>
    </main>
  );
}

export default async function Home() {
  const user = await getSessionUser();

  return user === null ? <SignedOutHome /> : <SignedInHome user={user} />;
}
