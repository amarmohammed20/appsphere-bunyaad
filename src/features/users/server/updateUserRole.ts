import 'server-only';

import { requireAdmin } from '@/lib/auth/session';
import { createSupabaseClient } from '@/lib/supabase/createSupabaseClient';

import { usersLabels } from '../data/labels';
import { type UserMutationResult, type UserRole } from '../types';

export async function updateUserRole(id: string, role: UserRole): Promise<UserMutationResult> {
  const actor = await requireAdmin();

  if (id === actor.id) {
    return { ok: false, error: usersLabels.cannotChangeSelf };
  }

  const supabase = await createSupabaseClient();

  // Friendly pre-check; the profiles_protect_last_admin trigger is the wall.
  if (role === 'member') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    const { data: target } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .maybeSingle();

    if (target?.role === 'admin' && (count ?? 0) <= 1) {
      return { ok: false, error: usersLabels.lastAdmin };
    }
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);

  if (error) {
    console.error('updateUserRole failed', { code: error.code });
    return { ok: false, error: usersLabels.failure };
  }

  return { ok: true };
}
