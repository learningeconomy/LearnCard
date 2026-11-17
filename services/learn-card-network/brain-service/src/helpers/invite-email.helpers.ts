/** A contract request invite expires 30 days after it is sent. */
export const CONTRACT_REQUEST_INVITE_TTL_MS = 30 * 24 * 60 * 60_000;

/** At most this many invite emails per contract and email address inside the window. */
export const CONTRACT_REQUEST_INVITE_EMAIL_LIMIT = 3;
export const CONTRACT_REQUEST_INVITE_EMAIL_WINDOW_MS = 24 * 60 * 60_000;

/**
 * The stored and compared form of an invite email: trimmed and lower case.
 * Contact method values are compared with `toLower(trim(value))` in Cypher, so both sides match.
 */
export const normalizeInviteEmail = (email: string): string => email.trim().toLowerCase();
