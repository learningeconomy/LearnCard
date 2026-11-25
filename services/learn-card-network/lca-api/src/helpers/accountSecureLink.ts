/**
 * "Secure my account" deep-link builder for the PIN sign-in notice.
 *
 * Same tenant-branded base URL as the escrow cancel link (`escrowCancelLink.ts`):
 * the resolved `TenantBranding.appUrl`, falling back to LearnCard. The link
 * carries no token. Under PIN sign-in the owner's other devices stay signed in,
 * and the secure action itself needs a signed-in wallet (DID auth + fresh
 * challenge), so the URL only has to open the right screen.
 */

/** Path the app routes to its "Secure my account" flow. */
export const ACCOUNT_SECURE_PATH = '/account/secure';

/** `URL` rather than concatenation so a trailing slash on `baseUrl` never doubles. */
export const buildAccountSecureUrl = ({ baseUrl }: { baseUrl: string }): string =>
    new URL(ACCOUNT_SECURE_PATH, baseUrl).toString();
