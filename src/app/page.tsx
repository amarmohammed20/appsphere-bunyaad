import { ArrowRightIcon, DatabaseIcon, ShieldCheckIcon, UsersIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';

import { AppHeader } from '@/components/shared/AppHeader';
import { NavLink } from '@/components/shared/NavLink';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { getSessionUser, type SessionUser } from '@/features/auth/server/session';

const PILLARS = [
  {
    icon: ShieldCheckIcon,
    title: 'Secure by default',
    body: 'Row-level security, HttpOnly sessions, scrubbed error reports.',
  },
  {
    icon: DatabaseIcon,
    title: 'Schema first',
    body: 'Migrations generated from one source of truth, checked in CI.',
  },
  {
    icon: ZapIcon,
    title: 'Rules that run',
    body: 'Architecture boundaries enforced by lint, proven by a canary.',
  },
];

function SignedOutHome() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="glow-pulse bg-muted pointer-events-none absolute -top-56 left-1/2 h-[32rem] w-[64rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="fade-up flex flex-col items-center text-center">
          <span className="border-border bg-card/60 text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="bg-foreground size-1.5 rounded-full" />
            AppSphere boilerplate
          </span>

          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            The foundation every project starts from.
          </h1>

          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-balance">
            One codebase where the rules enforce themselves — so the twentieth project is as careful
            as the first.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-in">
                Sign in <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
        </div>

        <section className="fade-up fade-up-delay-2 mt-20 grid w-full gap-4 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-border bg-card/50 rounded-2xl border p-6">
              <span className="bg-muted text-foreground flex size-9 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <p className="mt-4 font-medium">{title}</p>
              <p className="text-muted-foreground mt-1.5 text-sm">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof UsersIcon;
}) {
  return (
    <Link
      href={href}
      className="group border-border bg-card hover:border-ring hover:bg-muted/40 relative rounded-2xl border p-6 transition-colors"
    >
      <span className="bg-muted text-foreground flex size-9 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <p className="mt-4 flex items-center justify-between font-medium">
        {title}
        <ArrowRightIcon className="text-muted-foreground size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
      </p>
      <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>
    </Link>
  );
}

function SignedInHome({ user }: { user: SessionUser }) {
  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        fullName={user.fullName}
        email={user.email}
        role={user.role}
        actions={<SignOutButton />}
        nav={
          <>
            <NavLink href="/">Overview</NavLink>
            {user.role === 'admin' && <NavLink href="/users">Team</NavLink>}
          </>
        }
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        <div className="fade-up">
          <h1 className="text-4xl font-semibold tracking-tight">Welcome back, {firstName}.</h1>
          <p className="text-muted-foreground mt-2">
            Everything below is a starting point. Replace it with the real thing.
          </p>
        </div>

        <section className="fade-up fade-up-delay-2 mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {user.role === 'admin' && (
            <ActionCard
              href="/users"
              icon={UsersIcon}
              title="Manage the team"
              description="Roles, access, and who belongs here."
            />
          )}

          <div className="border-border rounded-2xl border border-dashed p-6">
            <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
              <ZapIcon className="size-4" />
            </span>
            <p className="mt-4 font-medium">Build something</p>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Your first feature replaces this card. Copy the shape of{' '}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">features/users</code>.
            </p>
          </div>

          {user.role !== 'admin' && (
            <div className="border-border rounded-2xl border border-dashed p-6">
              <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                <UsersIcon className="size-4" />
              </span>
              <p className="mt-4 font-medium">You&apos;re a member</p>
              <p className="text-muted-foreground mt-1.5 text-sm">
                An admin can promote you from the team page.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default async function Home() {
  const user = await getSessionUser();

  return user === null ? <SignedOutHome /> : <SignedInHome user={user} />;
}
