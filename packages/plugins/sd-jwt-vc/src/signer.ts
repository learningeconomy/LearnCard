import { compactVerify, importJWK, type JWK } from 'jose';

import { SdJwtVcError } from './types';

export type IssuerVerifier = (data: string, sig: string) => Promise<boolean>;

export interface CreateJoseVerifierResult {
    verifier: IssuerVerifier;
    getLastError: () => Error | undefined;
}

export const createJoseVerifier = async (
    publicJwk: JWK,
    alg: string
): Promise<CreateJoseVerifierResult> => {
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

    let lastError: Error | undefined;

    const verifier: IssuerVerifier = async (data, sig) => {
        const compact = `${data}.${sig}`;
        try {
            await compactVerify(compact, key);
            lastError = undefined;
            return true;
        } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            return false;
        }
    };

    return { verifier, getLastError: () => lastError };
};
