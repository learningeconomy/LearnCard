import { compactVerify, importJWK, base64url, type JWK } from 'jose';
import { ed25519 } from '@noble/curves/ed25519';
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
    // Ed25519 is unavailable in older Android WebViews. Keep signature verification
    // independent of WebCrypto while preserving JOSE algorithm/critical-header checks.
    if (alg === 'EdDSA') {
        if (
            publicJwk.kty !== 'OKP' ||
            publicJwk.crv !== 'Ed25519' ||
            typeof publicJwk.x !== 'string'
        ) {
            throw new SdJwtVcError(
                'verification_method_not_found',
                'Expected an Ed25519 issuer key'
            );
        }
        const publicKey = base64url.decode(publicJwk.x);
        if (publicKey.length !== 32)
            throw new SdJwtVcError('verification_method_not_found', 'Invalid Ed25519 issuer key');
        let lastError: Error | undefined;
        return {
            verifier: async (data, sig) => {
                try {
                    const header = decodeJsonSegment(data.split('.')[0]!);
                    if (header.alg !== 'EdDSA' || header.crit !== undefined || header.b64 === false)
                        throw new Error('Unsupported protected header');
                    if (
                        !ed25519.verify(
                            base64url.decode(sig),
                            new TextEncoder().encode(data),
                            publicKey,
                            { zip215: false }
                        )
                    )
                        throw new Error('Invalid issuer signature');
                    lastError = undefined;
                    return true;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    return false;
                }
            },
            getLastError: () => lastError,
        };
    }
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

    let privateKey: Uint8Array;
    try {
        privateKey = base64url.decode(privateJwk.d);
        if (
            privateKey.length !== 32 ||
            typeof privateJwk.x !== 'string' ||
            base64url.encode(ed25519.getPublicKey(privateKey)) !== privateJwk.x
        )
            throw new Error('Ed25519 keypair mismatch');
    } catch (cause) {
        throw new SdJwtVcError('kb_jwt_invalid', 'Invalid Ed25519 signing key', { cause });
    }
    return async (data: string): Promise<string> => {
        const segments = data.split('.');
        if (segments.length !== 2 || segments.some(segment => !segment))
            throw new SdJwtVcError('kb_jwt_invalid', 'Malformed JWS signing input');
        try {
            const header = decodeJsonSegment(segments[0]!);
            decodeJsonSegment(segments[1]!);
            if (header.alg !== 'EdDSA' || header.crit !== undefined || header.b64 === false)
                throw new Error('Unsupported signing header');
            return base64url.encode(ed25519.sign(new TextEncoder().encode(data), privateKey));
        } catch (cause) {
            throw new SdJwtVcError('kb_jwt_invalid', 'Could not sign key binding proof', { cause });
        }
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
