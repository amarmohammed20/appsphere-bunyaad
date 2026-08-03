import { type ENQUIRY_STATUSES } from './data/constants';

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

export type SubmitEnquiryResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
