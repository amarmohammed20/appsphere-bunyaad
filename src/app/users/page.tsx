import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { UsersTable } from '@/features/users/components/UsersTable';
import { usersLabels } from '@/features/users/data/labels';
import { listUsers } from '@/features/users/server/queries';
import { requireAdminPage } from '@/features/users/server/requireAdminPage';

export const metadata = { title: 'Team' };

export default async function UsersPage() {
  const admin = await requireAdminPage();
  const users = await listUsers();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {usersLabels.heading}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{usersLabels.lead}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-500 sm:block dark:text-zinc-400">
            {admin.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      <UsersTable users={users} currentUserId={admin.id} />
    </main>
  );
}
