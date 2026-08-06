import 'server-only';

// Re-exported through the feature so routing code can ask who is signed in
// without importing lib/supabase, which only server folders may touch.
export { getSessionUser, type SessionUser } from '@/lib/auth/session';
