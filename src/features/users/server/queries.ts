import 'server-only';

import { requireRole } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { type Database } from '@/types/database.types';

import { USER_ROLES } from '../data/constants';
import { type User } from '../types';

// Derived from the generated schema types, so a column rename fails the build
// here rather than at runtime.
type ProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name' | 'email' | 'role' | 'created_at'
>;

const PROFILE_COLUMNS = 'id, full_name, email, role, created_at';

// The database constrains role with a CHECK, but the generated type is plain
// `string` — codegen cannot see CHECK constraints. Narrow it explicitly and
// treat an unknown value as the data corruption it would be.
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

// Requires admin: the member view of the app has no user list. RLS enforces
// the same rule underneath — this check is the friendly error, not the wall.
export async function listUsers(): Promise<User[]> {
  await requireRole('admin');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Failed to load users');
  }

  return data.map(toUser);
}
