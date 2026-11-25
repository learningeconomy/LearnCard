/**
 * Escrow recovery cancel-link deep-link builder.
 *
 * Mirrors the existing tenant-branded app-link pattern used elsewhere in the
 * monorepo (brain-service's `generateClaimUrl` / `generateGuardianApprovalUrl`,
 * `inbox.helpers.ts`'s `new URL('/notifications', appUrl)`): prefer the
 * resolved tenant's `TenantBranding.appUrl`, which already falls back to the
 * LearnCard default (`https://learncard.app`) via `resolveBranding()` when a
 * tenant has no override.
 */

import { resolveBranding } from '@learncard/email-templates';
import type { Context } from '@routes';

/** Base app URL (e.g. `https://vetpass.app`) for constructing escrow deep links. */
export const resolveEscrowAppBaseUrl = (ctx: Pick<Context, 'tenant'>): string =>
    resolveBranding(ctx.tenant?.emailBranding).appUrl;

/**
 * Builds the single-use "cancel this recovery" link sent in the hold-started
 * email. Uses `URL`/`URLSearchParams` rather than string concatenation so
 * `holdId`/`token` are correctly percent-encoded and a trailing slash on
 * `baseUrl` never produces a doubled `//recovery/cancel`.
 */
export const buildEscrowCancelUrl = ({
    baseUrl,
    holdId,
    token,
}: {
    baseUrl: string;
    holdId: string;
    token: string;
}): string => {
    const url = new URL('/recovery/cancel', baseUrl);
    url.searchParams.set('holdId', holdId);
    url.searchParams.set('token', token);
    return url.toString();
};
