import { AppHeader } from '@/components/shared/AppHeader';
import { NavLink } from '@/components/shared/NavLink';
import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { UsersTable } from '@/features/users/components/UsersTable';
import { usersLabels } from '@/features/users/data/labels';
import { listUsers } from '@/features/users/server/listUsers';
import { requireAdminPage } from '@/features/users/server/requireAdminPage';

export const metadata = { title: 'Team' };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default async function UsersPage() {
  const admin = await requireAdminPage();
  const users = await listUsers();
  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        fullName={admin.fullName}
        email={admin.email}
        role={admin.role}
        actions={<SignOutButton />}
        nav={
          <>
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/users">Team</NavLink>
          </>
        }
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="fade-up flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{usersLabels.heading}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{usersLabels.lead}</p>
          </div>
        </div>

        <section className="fade-up fade-up-delay-1 mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Members" value={users.length} />
          <Stat label="Admins" value={adminCount} />
          <Stat label="Standard" value={users.length - adminCount} />
        </section>

        <section className="fade-up fade-up-delay-2 mt-8">
          <UsersTable users={users} currentUserId={admin.id} />
        </section>
      </main>
    </div>
  );
}
