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

    return 'active';
};
