import { compactVerify, importJWK, type JWK } from 'jose';

import { SdJwtVcError } from './types';

export type IssuerVerifier = (data: string, sig: string) => Promise<boolean>;

export const createJoseVerifier = async (publicJwk: JWK, alg: string): Promise<IssuerVerifier> => {
    let key;
    try {
        key = await importJWK(publicJwk, alg);
    } catch (e) {
        throw new SdJwtVcError(
            'verification_method_not_found',
            `Failed to import issuer JWK for alg ${alg}: ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }

    return async (data: string, sig: string): Promise<boolean> => {
        const compact = `${data}.${sig}`;
        try {
            await compactVerify(compact, key);
            return true;
        } catch {
            return false;
        }
    };
};

export const decodeJoseHeader = (jwt: string): Record<string, unknown> => {
    const parts = jwt.split('.');
    if (parts.length < 2) {
        throw new SdJwtVcError('invalid_jwt', 'JWT must have at least 2 segments');
    }
    const headerSegment = parts[0]!;
    try {
        const padded = headerSegment + '='.repeat((4 - (headerSegment.length % 4)) % 4);
        const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(normalized);
        return JSON.parse(json);
    } catch (e) {
        throw new SdJwtVcError(
            'invalid_jwt',
            `Failed to decode JWT header: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }
};
