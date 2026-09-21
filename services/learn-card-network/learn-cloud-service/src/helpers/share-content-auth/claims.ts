import {
    isBoundedNonce,
    isCanonicalBase64Url,
    isOpaqueIdentifier,
    isPlainObject,
    isSafeContentVersion,
    isSafeEpochSecond,
    isSha256Hex,
    isShareContentOperation,
} from './canonical';
import {
    SHARE_CONTENT_AUTH_PURPOSE,
    SHARE_CONTENT_CLAIM_FIELDS,
    type ShareContentAuthorizationClaims,
    type ShareContentTrustConfig,
} from './types';

/** Share ids are 16 CSPRNG bytes → exactly 22 canonical base64url chars. */
export const SHARE_ID_BYTES = 16;

const MAX_OPAQUE_IDENTIFIER_LENGTH = 128;

export type SignedClaimsResult =
    { ok: true; raw: unknown } | { ok: false; reason: 'MALFORMED_CLAIMS' };

/**
 * Locate the JSON claims the holder signed. DIDKit serializes the presentation
 * proof `challenge` into the JWT `nonce`; some clients surface it under
 * `vp.proof.challenge`. Exactly one location/value must be present.
 */
export const extractSignedClaims = (payload: Record<string, unknown>): SignedClaimsResult => {
    const nonce = payload.nonce;
    const vp = payload.vp;

    const proofChallenge =
        isPlainObject(vp) && isPlainObject(vp.proof) ? vp.proof.challenge : undefined;

    const candidates = [nonce, proofChallenge].filter(candidate => candidate !== undefined);

    if (candidates.length === 0) return { ok: false, reason: 'MALFORMED_CLAIMS' };
    if (candidates.length === 2 && candidates[0] !== candidates[1]) {
        return { ok: false, reason: 'MALFORMED_CLAIMS' };
    }

    const challenge = candidates[0];

    if (typeof challenge !== 'string' || challenge.length === 0) {
        return { ok: false, reason: 'MALFORMED_CLAIMS' };
    }

    try {
        return { ok: true, raw: JSON.parse(challenge) };
    } catch {
        return { ok: false, reason: 'MALFORMED_CLAIMS' };
    }
};

export type ParseClaimsResult =
    | { ok: true; claims: ShareContentAuthorizationClaims }
    | {
          ok: false;
          reason:
              | 'MALFORMED_CLAIMS'
              | 'UNKNOWN_CLAIM_FIELD'
              | 'INVALID_CLAIMS'
              | 'INVALID_SHARE_ID'
              | 'INVALID_IDENTIFIER'
              | 'INVALID_JTI'
              | 'OPERATION_NOT_ALLOWED'
              | 'PURPOSE_MISMATCH';
      };

/**
 * Strict structural validation of the signed claims. Audience/purpose/time and
 * request binding are checked separately by the verifier so each has a distinct
 * rejection reason.
 */
export const parseShareContentAuthorizationClaims = (
    raw: unknown,
    config: ShareContentTrustConfig
): ParseClaimsResult => {
    if (!isPlainObject(raw)) return { ok: false, reason: 'MALFORMED_CLAIMS' };

    for (const key of Object.keys(raw)) {
        if (!(SHARE_CONTENT_CLAIM_FIELDS as readonly string[]).includes(key)) {
            return { ok: false, reason: 'UNKNOWN_CLAIM_FIELD' };
        }
    }

    const {
        iss,
        aud,
        purpose,
        namespace,
        op,
        shareId,
        contentVersion,
        ownerProfileId,
        objectId,
        operationId,
        requestHash,
        iat,
        exp,
        jti,
    } = raw;

    if (typeof iss !== 'string' || iss.length === 0) return { ok: false, reason: 'INVALID_CLAIMS' };
    if (typeof aud !== 'string' || aud.length === 0) return { ok: false, reason: 'INVALID_CLAIMS' };
    if (purpose !== SHARE_CONTENT_AUTH_PURPOSE) return { ok: false, reason: 'PURPOSE_MISMATCH' };

    if (!isOpaqueIdentifier(namespace, MAX_OPAQUE_IDENTIFIER_LENGTH)) {
        return { ok: false, reason: 'INVALID_IDENTIFIER' };
    }

    if (!isShareContentOperation(op)) return { ok: false, reason: 'OPERATION_NOT_ALLOWED' };

    if (!isCanonicalBase64Url(shareId, SHARE_ID_BYTES)) {
        return { ok: false, reason: 'INVALID_SHARE_ID' };
    }

    if (!isSafeContentVersion(contentVersion)) return { ok: false, reason: 'INVALID_CLAIMS' };

    if (!isOpaqueIdentifier(ownerProfileId, MAX_OPAQUE_IDENTIFIER_LENGTH)) {
        return { ok: false, reason: 'INVALID_IDENTIFIER' };
    }

    if (!isOpaqueIdentifier(objectId, MAX_OPAQUE_IDENTIFIER_LENGTH)) {
        return { ok: false, reason: 'INVALID_IDENTIFIER' };
    }

    if (!isOpaqueIdentifier(operationId, MAX_OPAQUE_IDENTIFIER_LENGTH)) {
        return { ok: false, reason: 'INVALID_IDENTIFIER' };
    }

    if (!isSha256Hex(requestHash)) return { ok: false, reason: 'INVALID_CLAIMS' };

    if (!isSafeEpochSecond(iat) || !isSafeEpochSecond(exp)) {
        return { ok: false, reason: 'INVALID_CLAIMS' };
    }

    if (!isBoundedNonce(jti, config.minJtiLength, config.maxJtiLength)) {
        return { ok: false, reason: 'INVALID_JTI' };
    }

    return {
        ok: true,
        claims: {
            iss,
            aud,
            purpose: SHARE_CONTENT_AUTH_PURPOSE,
            namespace,
            op,
            shareId,
            contentVersion,
            ownerProfileId,
            objectId,
            operationId,
            requestHash,
            iat,
            exp,
            jti,
        },
    };
};
