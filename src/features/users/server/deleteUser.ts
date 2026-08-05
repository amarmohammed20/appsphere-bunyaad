import 'server-only';

import { requireRole } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

import { usersLabels } from '../data/labels';
import { type UserMutationResult } from '../types';

/**
 * The only place a profile is removed. Deleting the profile row is enough for
 * the app; removing the auth account itself needs the service role key and
 * belongs to an admin backend, not a request handler.
 */
export async function deleteUser(id: string): Promise<UserMutationResult> {
  const actor = await requireRole('admin');

  if (id === actor.id) {
    return { ok: false, error: usersLabels.cannotChangeSelf };
  }

  const supabase = await createClient();

  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', id)
    .maybeSingle();

  if (target?.role === 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if ((count ?? 0) <= 1) {
      return { ok: false, error: usersLabels.lastAdmin };
    }
  }

  const { error } = await supabase.from('profiles').delete().eq('id', id);

  if (error) {
    console.error('deleteUser failed', { code: error.code });
    return { ok: false, error: usersLabels.failure };
  }

  return { ok: true };
}
