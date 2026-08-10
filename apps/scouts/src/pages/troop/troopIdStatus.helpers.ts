import type { CredentialLifecycleStatus } from 'learn-card-base';

export type TroopIdCredentialStatus = 'valid' | 'pending' | 'suspended' | 'revoked';
export type TroopIdIssuanceState = 'accepted' | 'pending';

export interface DeriveTroopIdStatusOptions {
    lifecycleStatus: CredentialLifecycleStatus;
    issuanceState?: TroopIdIssuanceState;
    isLoading?: boolean;
}

export const deriveTroopIdStatus = ({
    lifecycleStatus,
    issuanceState = 'accepted',
    isLoading = false,
}: DeriveTroopIdStatusOptions): TroopIdCredentialStatus | undefined => {
    if (isLoading) return undefined;
    if (lifecycleStatus === 'revoked') return 'revoked';
    if (lifecycleStatus === 'suspended') return 'suspended';
    if (issuanceState === 'pending') return 'pending';
    return 'valid';
};

export const isCredentialActionRestricted = (
    status: TroopIdCredentialStatus | undefined
): boolean => status !== 'valid';
