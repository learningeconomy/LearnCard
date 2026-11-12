/**
 * Domain of the placeholder Firebase email lca-api assigns to ClassLink students who
 * have no email in their ClassLink profile (`<uid>@users.classlink.invalid`). `.invalid`
 * is reserved (RFC 2606), so the address can never receive mail.
 */
export const SYNTHETIC_EMAIL_DOMAIN = 'users.classlink.invalid';

/**
 * True when `email` is a synthetic placeholder rather than a real contact address.
 * Callers must treat a synthetic email exactly like "no email": never display it,
 * prefill it, send it anywhere, or use it as a recovery/contact method.
 */
export const isSyntheticEmail = (email: string | null | undefined): boolean =>
    typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);

/** Returns `email` when it is a real address, otherwise `undefined`. */
export const getContactEmail = (email: string | null | undefined): string | undefined =>
    email && !isSyntheticEmail(email) ? email : undefined;
