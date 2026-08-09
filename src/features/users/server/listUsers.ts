import 'server-only';

import { requireAdmin } from '@/lib/auth/session';
import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';
import { type Database } from '@/types/database.types';

import { USER_ROLES } from '../data/constants';
import { type User } from '../types';

type ProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name' | 'email' | 'role' | 'created_at'
>;

const PROFILE_COLUMNS = 'id, full_name, email, role, created_at';

// Codegen cannot see CHECK constraints, so the generated type is plain
// string; an unknown value is corruption and throws.
function toRole(value: string): User['role'] {
  const role = USER_ROLES.find((known) => known === value);

  if (role === undefined) {
    throw new Error(`Unknown user role in database: ${value}`);
  }

  return role;
}

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: toRole(row.role),
    createdAt: row.created_at,
  };
}

// The friendly error; RLS is the wall underneath.
export async function listUsers(): Promise<User[]> {
  await requireAdmin();

  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Failed to load users');
  }

  return data.map(toUser);
}
