'use client';

import { useState, useTransition } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { initialsOf } from '@/lib/initialsOf';

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
    return (
      <div className="border-border rounded-xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{usersLabels.empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error !== null && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      <div className="border-border overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11">{usersLabels.nameField}</TableHead>
              <TableHead className="hidden h-11 sm:table-cell">{usersLabels.emailField}</TableHead>
              <TableHead className="h-11 w-40">{usersLabels.roleField}</TableHead>
              <TableHead className="h-11 w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;

              return (
                <TableRow key={user.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs font-semibold">
                          {initialsOf(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-medium">
                          {user.fullName}
                          {isSelf && (
                            <Badge variant="secondary" className="font-normal">
                              {usersLabels.you}
                            </Badge>
                          )}
                        </p>
                        <p className="text-muted-foreground truncate text-xs sm:hidden">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {user.email}
                  </TableCell>

                  <TableCell>
                    <Select
                      value={user.role}
                      // The no-self rule, surfaced up front rather than as an error.
                      disabled={isPending || isSelf}
                      onValueChange={(value) => {
                        // find() narrows without a cast, which lint forbids.
                        const role = USER_ROLES.find((known) => known === value);

                        if (role !== undefined) {
                          runMutation(() => updateUserRole(user.id, role));
                        }
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label={`${usersLabels.roleField}: ${user.fullName}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isPending || isSelf}>
                          {usersLabels.delete}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {usersLabels.confirmRemoveTitle} {user.fullName}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {usersLabels.confirmRemoveBody}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{usersLabels.cancel}</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => runMutation(() => deleteUser(user.id))}
                          >
                            {usersLabels.delete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
