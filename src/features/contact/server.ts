import 'server-only';

/**
 * Server-only public API. Import from Server Components, Server Actions and
 * Route Handlers — never from a Client Component.
 *
 * Split from `index.ts` because `server-only` fails the build if it reaches a
 * browser bundle, and a single barrel would drag it there the first time a
 * Client Component imported anything from this feature.
 */

export { listEnquiries, getEnquiry } from './server/queries';
export { createEnquiry } from './server/createEnquiry';
export { submitEnquiry } from './server/actions';
