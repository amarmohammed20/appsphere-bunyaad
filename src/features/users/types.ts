import { type MutationResult } from '@/types/mutation';

import { type USER_ROLES } from './data/constants';

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type UserMutationResult = MutationResult;
