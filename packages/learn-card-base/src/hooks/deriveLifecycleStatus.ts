import type { VerificationCheck } from '@learncard/types';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

export const deriveLifecycleStatus = (
    check: Partial<VerificationCheck> | undefined | null
): CredentialLifecycleStatus => {
    const entries = check?.status ?? [];
    if (entries.some(entry => entry.statusPurpose === 'revocation' && entry.isSet)) {
        return 'revoked';
    }
    if (entries.some(entry => entry.statusPurpose === 'suspension' && entry.isSet)) {
        return 'suspended';
    }

    const errors = check?.errors ?? [];
    if (errors.some(error => /revok/i.test(error))) return 'revoked';
    if (errors.some(error => /suspend/i.test(error))) return 'suspended';

    return 'active';
};
