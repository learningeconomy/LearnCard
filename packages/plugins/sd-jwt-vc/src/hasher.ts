import { SdJwtVcError } from './types';

const SUPPORTED_ALGS = new Set(['sha-256', 'SHA-256', 'sha256']);

export const sha256Hasher = async (
    data: string | ArrayBuffer,
    alg: string
): Promise<Uint8Array> => {
    if (!SUPPORTED_ALGS.has(alg)) {
        throw new SdJwtVcError(
            'unsupported_alg',
            `Unsupported hash algorithm: "${alg}". Only sha-256 is supported.`
        );
    }

    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(digest);
};

export const isSupportedHashAlg = (alg: string): boolean => SUPPORTED_ALGS.has(alg);
