'use client';

import { useState, useTransition } from 'react';

import { deleteUser } from '../actions/deleteUser';
import { updateUserRole } from '../actions/updateUserRole';
import { USER_ROLES } from '../data/constants';
import { roleLabels, usersLabels } from '../data/labels';
import { type User } from '../types';

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runMutation(mutation: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const mutationResult = await mutation();

      if (!mutationResult.ok) {
        setError(mutationResult.error ?? usersLabels.failure);
      }
    });
  }

  if (users.length === 0) {
    return <p className="text-zinc-500 dark:text-zinc-400">{usersLabels.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error !== null && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">{usersLabels.nameField}</th>
              <th className="px-4 py-3 font-medium">{usersLabels.emailField}</th>
              <th className="px-4 py-3 font-medium">{usersLabels.roleField}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;

              return (
                <tr
                  key={user.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {user.fullName}
                    {isSelf && (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {usersLabels.you}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      // The no-self rule, surfaced up front.
                      disabled={isPending || isSelf}
                      onChange={(event) => {
                        // find() narrows without a cast, which lint forbids.
                        const role = USER_ROLES.find((known) => known === event.target.value);

                        if (role !== undefined) {
                          runMutation(() => updateUserRole(user.id, role));
                        }
                      }}
                      className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm transition focus:border-zinc-900 focus:outline-none disabled:opacity-40 dark:border-zinc-700 dark:focus:border-zinc-100"
                      aria-label={`${usersLabels.roleField}: ${user.fullName}`}
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={isPending || isSelf}
                      onClick={() => runMutation(() => deleteUser(user.id))}
                      className="rounded-lg px-2 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {usersLabels.delete}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
