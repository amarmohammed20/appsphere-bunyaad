import type { NextConfig } from 'next';

/**
 * Response headers that never vary per request, so they belong here rather than
 * in `proxy.ts`. Content-Security-Policy is the deliberate exception: it needs a
 * fresh nonce per response, so it cannot be a constant (TODO section 18a).
 */
const securityHeaders = [
  // Stops the browser guessing a file's type from its bytes. Without it an
  // uploaded file served as text/plain can be re-read as a script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No page here is meant to be framed, and framing is how clickjacking works.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Send the full URL only to ourselves. Cross-origin requests get the origin,
  // so a path containing an id never leaks to a third party.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nothing here uses these devices; denying them means an injected script
  // cannot ask for them either.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HTTPS only, for two years, subdomains included. Ignored over plain http,
  // so local development is unaffected.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  // Next's config API expects a promise here. Nothing to await — the headers
  // are a constant — so it is resolved directly rather than marked `async`.
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
