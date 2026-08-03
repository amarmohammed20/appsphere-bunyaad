import 'server-only';

import { createClient } from '@/lib/supabase/server';

import { type ContactEnquiry } from '../types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface EnquiryRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactEnquiry['status'];
  created_at: string;
}

const ENQUIRY_COLUMNS = 'id, name, email, message, status, created_at';

async function requireSignedInUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    throw new Error('Not authorised');
  }

  return user;
}

function toContactEnquiry(row: EnquiryRow): ContactEnquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listEnquiries(): Promise<ContactEnquiry[]> {
  const supabase = await createClient();
  await requireSignedInUser(supabase);

  const { data, error } = await supabase
    .from('contact_enquiries')
    .select(ENQUIRY_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to load enquiries');
  }

  return data.map(toContactEnquiry);
}

export async function getEnquiry(id: string): Promise<ContactEnquiry | null> {
  const supabase = await createClient();
  await requireSignedInUser(supabase);

  const { data, error } = await supabase
    .from('contact_enquiries')
    .select(ENQUIRY_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error('Failed to load enquiry');
  }

  return data === null ? null : toContactEnquiry(data);
}
