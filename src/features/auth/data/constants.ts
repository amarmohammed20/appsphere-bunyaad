// Must match minimum_password_length in supabase/config.toml — GoTrue is the
// boundary, so the weaker of the two would be the real policy.
export const MIN_PASSWORD_LENGTH = 8;

// Every accepted type is a way to mint a session, so this is deliberately
// narrower than the SDK's own union. Widen it only when a flow that needs
// another type is actually enabled.
export const EMAIL_LINK_TYPES = ['recovery'] as const;
export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];
