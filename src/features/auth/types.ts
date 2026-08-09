import { type MutationResult } from '@/types/mutation';

import { type EMAIL_LINK_TYPES } from './data/constants';

export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

export type AuthResult = MutationResult;
