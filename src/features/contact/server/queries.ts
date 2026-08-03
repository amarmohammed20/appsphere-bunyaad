import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { type ContactEnquiry } from '../types';

/** Reads. Every Supabase query for this feature lives here. */

export async function listEnquiries(): Promise<ContactEnquiry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contact_enquiries')
    .select('id, name, email, message, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to load enquiries');
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getEnquiry(id: string): Promise<ContactEnquiry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contact_enquiries')
    .select('id, name, email, message, status, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error('Failed to load enquiry');
  }

  if (data === null) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    message: data.message,
    status: data.status,
    createdAt: data.created_at,
  };
}
