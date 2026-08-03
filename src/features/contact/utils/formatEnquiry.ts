import { enquiryStatusLabels } from '../data/labels';
import { type ContactEnquiry } from '../types';

/** Pure functions for this feature. No IO, no React, no Supabase. */

export function formatEnquiryStatus(enquiry: ContactEnquiry): string {
  return enquiryStatusLabels[enquiry.status];
}

export function summariseEnquiry(enquiry: ContactEnquiry, maxLength = 80): string {
  const collapsed = enquiry.message.replace(/\s+/g, ' ').trim();
  return collapsed.length <= maxLength ? collapsed : `${collapsed.slice(0, maxLength - 1)}…`;
}
