import type { CredentialLifecycleStatus } from 'learn-card-base';

import type { TroopIdCredentialStatus, TroopIdIssuanceState } from './troopIdStatus.types';

export type { TroopIdCredentialStatus, TroopIdIssuanceState } from './troopIdStatus.types';

export interface DeriveTroopIdStatusOptions {
    lifecycleStatus: CredentialLifecycleStatus;
    issuanceState?: TroopIdIssuanceState;
    isLoading?: boolean;
    isError?: boolean;
    lifecycleEnabled?: boolean;
}

export const deriveTroopIdStatus = ({
    lifecycleStatus,
    issuanceState = 'accepted',
    isLoading = false,
    isError = false,
    lifecycleEnabled = true,
}: DeriveTroopIdStatusOptions): TroopIdCredentialStatus | undefined => {
    if (!lifecycleEnabled || isLoading || isError) return undefined;
    if (lifecycleStatus === 'revoked') return 'revoked';
    if (lifecycleStatus === 'suspended') return 'suspended';
    if (issuanceState === 'pending') return 'pending';
    return 'valid';
};

export const isCredentialActionRestricted = (
    status: TroopIdCredentialStatus | undefined
): boolean => status !== 'valid';

export interface CanSharePersonalTroopIdOptions {
    isPersonalId: boolean;
    lifecycleLoading: boolean;
    status: TroopIdCredentialStatus | undefined;
}

export const canSharePersonalTroopId = ({
    isPersonalId,
    lifecycleLoading,
    status,
}: CanSharePersonalTroopIdOptions): boolean =>
    isPersonalId && !lifecycleLoading && !isCredentialActionRestricted(status);

export interface TroopIdContentRestrictionOptions {
    hasParentAdminAccess: boolean;
    lifecycleLoading: boolean;
    status: TroopIdCredentialStatus | undefined;
}

export const isTroopIdContentRestricted = ({
    hasParentAdminAccess,
    lifecycleLoading,
    status,
}: TroopIdContentRestrictionOptions): boolean =>
    !hasParentAdminAccess && (lifecycleLoading || isCredentialActionRestricted(status));

export const shouldShowTroopIdStatus = ({
    lifecycleEnabled = true,
    credentialUri,
}: {
    lifecycleEnabled?: boolean;
    credentialUri?: string;
}): boolean => lifecycleEnabled && Boolean(credentialUri);
