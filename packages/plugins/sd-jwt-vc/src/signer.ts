import { compactVerify, importJWK, SignJWT, type JWK } from 'jose';
import type { Signer as SdJwtLibSigner } from '@sd-jwt/types';

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

export interface CreateEd25519KbSignerOptions {
    privateJwk: JWK;
}

export const createEd25519KbSigner = async (
    options: CreateEd25519KbSignerOptions
): Promise<SdJwtLibSigner> => {
    const { privateJwk } = options;

    if (privateJwk.kty !== 'OKP' || privateJwk.crv !== 'Ed25519') {
        throw new SdJwtVcError(
            'kb_jwt_invalid',
            `createEd25519KbSigner only supports Ed25519 OKP keys (got kty=${privateJwk.kty}, crv=${privateJwk.crv})`
        );
    }
    if (typeof privateJwk.d !== 'string' || privateJwk.d.length === 0) {
        throw new SdJwtVcError(
            'kb_jwt_invalid',
            'createEd25519KbSigner requires a private JWK with a non-empty `d` (private scalar)'
        );
    }

    let privateKey;
    try {
        privateKey = await importJWK(privateJwk, 'EdDSA');
    } catch (e) {
        throw new SdJwtVcError(
            'kb_jwt_invalid',
            `Failed to import Ed25519 private JWK for KB-JWT signing: ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }

    return async (data: string): Promise<string> => {
        const dotIndex = data.indexOf('.');
        if (dotIndex < 0 || dotIndex === 0 || dotIndex === data.length - 1) {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                'KB-JWT signer received malformed JWS signing input (expected "<headerB64url>.<payloadB64url>")'
            );
        }

        const headerSegment = data.slice(0, dotIndex);
        const payloadSegment = data.slice(dotIndex + 1);

        let header: Record<string, unknown>;
        let payload: Record<string, unknown>;
        try {
            header = decodeJsonSegment(headerSegment);
            payload = decodeJsonSegment(payloadSegment);
        } catch (e) {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                `KB-JWT signer could not decode signing input: ${
                    e instanceof Error ? e.message : String(e)
                }`,
                { cause: e }
            );
        }

        let compact: string;
        try {
            compact = await new SignJWT(payload)
                .setProtectedHeader(header as { alg: string; typ: string })
                .sign(privateKey);
        } catch (e) {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                `Failed to sign KB-JWT with Ed25519 key: ${
                    e instanceof Error ? e.message : String(e)
                }`,
                { cause: e }
            );
        }

        const sigSegment = compact.split('.')[2];
        if (!sigSegment) {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                'KB-JWT signing produced no signature segment (jose returned malformed JWS)'
            );
        }
        return sigSegment;
    };
};

const decodeJsonSegment = (segment: string): Record<string, unknown> => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const text =
        typeof Buffer !== 'undefined'
            ? Buffer.from(padded, 'base64').toString('utf-8')
            : new TextDecoder().decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0)));
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JWS segment is not a JSON object');
    }
    return parsed as Record<string, unknown>;
};
