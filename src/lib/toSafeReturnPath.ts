// Rejects `//evil.com` and `/\evil.com` — startsWith('/') alone lets a
// crafted ?next= link navigate off-site after sign-in.
const SAFE_RELATIVE_PATH = /^\/(?!\/|\\)/;

export function toSafeReturnPath(raw: string | null | undefined): string {
  return typeof raw === 'string' && SAFE_RELATIVE_PATH.test(raw) ? raw : '/';
}
