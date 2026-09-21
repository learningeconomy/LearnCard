import { isCanonicalBase64Url, isPlainObject } from './canonical';
import type { ShareContentTrustConfig } from './types';

/**
 * Strict, bounded parsing of the compact JWS produced by DIDKit for a
 * holder-signed Verifiable Presentation. Nothing here is trusted: parsing only
 * establishes syntactic shape and the allowlisted signer before any resolver or
 * signature verifier is invoked.
 */

/** Remote-key and extension headers are never valid for this purpose. */
const FORBIDDEN_HEADER_FIELDS = ['jwk', 'jku', 'x5u', 'x5c', 'crit', 'enc', 'apu', 'apv'] as const;

const MAX_KID_LENGTH = 512;

export type ParsedCompactJwt = {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signingInput: string;
    signature: string;
};

export type ParseCompactJwtResult =
    | { ok: true; parsed: ParsedCompactJwt }
    | { ok: false; reason: 'TOKEN_TOO_LARGE' | 'MALFORMED_TOKEN' };

export const parseCompactJwt = (token: unknown, maxBytes: number): ParseCompactJwtResult => {
    if (typeof token !== 'string') return { ok: false, reason: 'MALFORMED_TOKEN' };
    if (Buffer.byteLength(token, 'utf8') > maxBytes)
        return { ok: false, reason: 'TOKEN_TOO_LARGE' };

    const parts = token.split('.');

    if (parts.length !== 3) return { ok: false, reason: 'MALFORMED_TOKEN' };

    const [headerPart, payloadPart, signaturePart] = parts;

    if (!headerPart || !payloadPart || !signaturePart) {
        return { ok: false, reason: 'MALFORMED_TOKEN' };
    }

    if (
        !isCanonicalBase64Url(headerPart) ||
        !isCanonicalBase64Url(payloadPart) ||
        !isCanonicalBase64Url(signaturePart)
    ) {
        return { ok: false, reason: 'MALFORMED_TOKEN' };
    }

    let header: unknown;
    let payload: unknown;

    try {
        header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
        payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    } catch {
        return { ok: false, reason: 'MALFORMED_TOKEN' };
    }

    if (!isPlainObject(header) || !isPlainObject(payload)) {
        return { ok: false, reason: 'MALFORMED_TOKEN' };
    }

    return {
        ok: true,
        parsed: {
            header,
            payload,
            signingInput: `${headerPart}.${payloadPart}`,
            signature: signaturePart,
        },
    };
};

export type ValidatedJwtHeader = {
    signerDid: string;
    /** Full `kid`, e.g. `did:web:brain.example#key-1`. */
    verificationMethod: string;
};

export type ValidateJwtHeaderResult =
    | { ok: true; value: ValidatedJwtHeader }
    | {
          ok: false;
          reason:
              | 'UNSUPPORTED_HEADER'
              | 'UNSUPPORTED_ALGORITHM'
              | 'MISSING_KID'
              | 'UNKNOWN_SIGNER'
              | 'UNKNOWN_VERIFICATION_METHOD';
      };

/**
 * Validate the JOSE header and apply the exact DID + verification-method
 * allowlist. This runs *before* the injected signature verifier, so an unknown
 * `kid` can never trigger did:web/did:key network resolution.
 */
export const validateShareContentJwtHeader = (
    header: Record<string, unknown>,
    config: ShareContentTrustConfig
): ValidateJwtHeaderResult => {
    if (
        Object.keys(header).some(field => !['alg', 'kid', 'typ'].includes(field)) ||
        (header.typ !== undefined && header.typ !== 'JWT')
    ) {
        return { ok: false, reason: 'UNSUPPORTED_HEADER' };
    }
    for (const field of FORBIDDEN_HEADER_FIELDS) {
        if (field in header) return { ok: false, reason: 'UNSUPPORTED_HEADER' };
    }

    const alg = header.alg;

    if (typeof alg !== 'string' || !config.allowedAlgorithms.includes(alg)) {
        return { ok: false, reason: 'UNSUPPORTED_ALGORITHM' };
    }

    const kid = header.kid;

    if (typeof kid !== 'string' || kid.length === 0 || kid.length > MAX_KID_LENGTH) {
        return { ok: false, reason: 'MISSING_KID' };
    }

    // Reject URLs / relative key references outright. Only a DID URL fragment is valid.
    if (/^[a-z][a-z0-9+.-]*:/i.test(kid) && !kid.startsWith('did:')) {
        return { ok: false, reason: 'UNSUPPORTED_HEADER' };
    }

    const hashIndex = kid.indexOf('#');

    if (hashIndex <= 0 || hashIndex === kid.length - 1) {
        return { ok: false, reason: 'MISSING_KID' };
    }

    const signerDid = kid.slice(0, hashIndex);

    if (!signerDid.startsWith('did:')) return { ok: false, reason: 'MISSING_KID' };

    if (!config.allowedServiceDids.includes(signerDid)) {
        return { ok: false, reason: 'UNKNOWN_SIGNER' };
    }

    if (!config.allowedVerificationMethods.includes(kid)) {
        return { ok: false, reason: 'UNKNOWN_VERIFICATION_METHOD' };
    }

    return { ok: true, value: { signerDid, verificationMethod: kid } };
};
