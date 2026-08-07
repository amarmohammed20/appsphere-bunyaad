'use server';

import { revalidatePath } from 'next/cache';

import { USER_ROLES } from '../data/constants';
import { usersLabels } from '../data/labels';
import { userIdSchema } from '../schemas/user';
import { updateUserRole as updateRoleRecord } from '../server/updateUserRole';
import { type UserMutationResult, type UserRole } from '../types';

export async function updateUserRole(id: string, role: UserRole): Promise<UserMutationResult> {
  const parsedId = userIdSchema.safeParse(id);

  if (!parsedId.success || !USER_ROLES.includes(role)) {
    return { ok: false, error: usersLabels.validationFailure };
  }

  const result = await updateRoleRecord(parsedId.data, role);

  if (result.ok) {
    revalidatePath('/users');
  }

  return result;
}
