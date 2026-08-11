import type { CredentialStatusResult } from 'learn-card-base/hooks/credentialStatus.types';

export type TroopIdCredentialStatus = 'valid' | 'pending' | 'suspended' | 'revoked';
export type TroopIdIssuanceState = 'accepted' | 'pending';

export interface TroopIdStatusResult extends Omit<CredentialStatusResult, 'status'> {
    status: TroopIdCredentialStatus | undefined;
}

type AssertFalse<T extends false> = T;
export type TroopIdStatusResultIsIndependent = AssertFalse<
    TroopIdStatusResult extends CredentialStatusResult ? true : false
>;
