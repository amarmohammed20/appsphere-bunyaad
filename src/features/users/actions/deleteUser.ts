'use server';

import { revalidatePath } from 'next/cache';

import { usersLabels } from '../data/labels';
import { userIdSchema } from '../schemas/user';
import { deleteUser as deleteUserRecord } from '../server/deleteUser';
import { type UserMutationResult } from '../types';

export async function deleteUser(id: string): Promise<UserMutationResult> {
  const parsed = userIdSchema.safeParse(id);

  if (!parsed.success) {
    return { ok: false, error: usersLabels.validationFailure };
  }

  const result = await deleteUserRecord(parsed.data);

  if (result.ok) {
    revalidatePath('/users');
  }

  return result;
}
