import type { VerificationCheck } from '@learncard/types';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

/**
 * Pure: map a raw VerificationCheck to a lifecycle status. Fails open to 'active'.
 *
 * Prefers the structured `status` entries (statusPurpose + isSet) when present;
 * falls back to scanning `errors` for older WASM builds that omit structured status.
 *
 * Kept in its own import-light module (type-only imports) so it can be unit-tested
 * without pulling in the `learn-card-base` barrel.
 */
export const deriveLifecycleStatus = (
    check: Partial<VerificationCheck> | undefined | null
): CredentialLifecycleStatus => {
    const entries = check?.status ?? [];
    if (entries.some(e => e.statusPurpose === 'revocation' && e.isSet)) return 'revoked';
    if (entries.some(e => e.statusPurpose === 'suspension' && e.isSet)) return 'suspended';

    const errors = check?.errors ?? [];
    if (errors.some(e => /revok/i.test(e))) return 'revoked';
    if (errors.some(e => /suspend/i.test(e))) return 'suspended';

    return 'active';
};
