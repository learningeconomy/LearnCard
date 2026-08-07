import { VerificationItem, VerificationStatusEnum } from '@learncard/types';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

/**
 * Override the "Status" row of a credential's verification items to reflect the
 * authoritative lifecycle status.
 *
 * The client-side status-list check (DIDKit/WASM) enforces `revocation` but does not
 * surface a set `suspension` bit, so a suspended credential's verifications otherwise read
 * "Not Revoked" (Success) — inconsistent with the desaturated/pilled card. When we know the
 * authoritative status (from the backend relationship status), replace the status row so the
 * verifications panel matches: Revoked = hard failure (red), Suspended = softer, reversible
 * warning (amber). Active/undefined leaves the client-verified items untouched.
 */
export const applyLifecycleStatusToVerifications = (
    items: VerificationItem[],
    lifecycleStatus?: CredentialLifecycleStatus
): VerificationItem[] => {
    if (lifecycleStatus !== 'revoked' && lifecycleStatus !== 'suspended') return items;

    const label = lifecycleStatus === 'revoked' ? 'Revoked' : 'Suspended';
    const statusItem: VerificationItem = {
        check: 'status',
        status:
            lifecycleStatus === 'revoked'
                ? VerificationStatusEnum.Failed
                : VerificationStatusEnum.Error,
        message: label,
        details: label,
    };

    return [...items.filter(item => !/status/i.test(item.check)), statusItem];
};

export default applyLifecycleStatusToVerifications;
