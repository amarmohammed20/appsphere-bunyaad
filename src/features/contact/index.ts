/**
 * Client-safe public API. Importable from anywhere, including Client
 * Components.
 *
 * Nothing here may reach `server/` or `api/` — those pull in `server-only`,
 * which fails the build if it lands in a browser bundle. Server exports live
 * in `./server`.
 */

export { ContactForm } from './components/ContactForm';
export { contactEnquirySchema, type ContactEnquiryInput } from './schemas/contact';
export { contactLabels, enquiryStatusLabels } from './data/labels';
export { formatEnquiryStatus, summariseEnquiry } from './utils/formatEnquiry';
export { type ContactEnquiry, type EnquiryStatus, type SubmitEnquiryResult } from './types';
