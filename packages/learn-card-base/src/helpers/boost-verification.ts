import { verifyBoostDerivation } from './boostVerification';

export { verifyBoostDerivation } from './boostVerification';

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

export const verifyCredentialIsDerivedFromBoost = (
    credential: Record<string, unknown>,
    boostTemplate: Record<string, unknown>,
    boostUri: string
): boolean => {
    if (!isRecord(credential) || !isRecord(boostTemplate) || !boostUri) return false;

    return verifyBoostDerivation(credential, boostTemplate, boostUri).verified;
};

export const getBoostDerivationStatus = (
    credential: Record<string, unknown>,
    boostUri: string
): 'verified' | 'unverified' | 'no-boost-id' => {
    if (!isRecord(credential) || typeof credential.boostId !== 'string' || !credential.boostId) {
        return 'no-boost-id';
    }

    return credential.boostId === boostUri ? 'verified' : 'unverified';
};
