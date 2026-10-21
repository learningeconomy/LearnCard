import { createHash } from 'node:crypto';

import {
    isCanonicalBase64Url,
    isOpaqueIdentifier,
    isPlainObject,
    isSafeContentVersion,
    isSha256Hex,
    isShareContentOperation,
} from './canonical';
import {
    SHARE_ID_BYTES,
    extractSignedClaims,
    parseShareContentAuthorizationClaims,
} from './claims';
import { isShareContentTrustConfigActive } from './config';
import { parseCompactJwt, validateShareContentJwtHeader } from './token';
import {
    SHARE_CONTENT_AUTH_PURPOSE,
    type PresentationVerificationResult,
    type PresentationVerifier,
    type ReplayStore,
    type ShareContentAuthorizationContext,
    type ShareContentAuthorizationRequest,
    type ShareContentAuthorizationResult,
    type ShareContentAuthorizationVerifier,
    type ShareContentTrustConfig,
} from './types';

export type CreateShareContentAuthorizationVerifierDependencies = {
    config: ShareContentTrustConfig;
    /** Injected DIDKit presentation verification. Never called before allowlist filtering. */
    verifyPresentation: PresentationVerifier;
    /** Injected atomic single-use replay store. */
    replayStore: ReplayStore;
    /** Injected epoch-seconds clock. Defaults to `Date.now()`. */
    now?: () => number;
};

const isValidAuthorizationRequest = (
    request: unknown
): request is ShareContentAuthorizationRequest => {
    if (!isPlainObject(request)) return false;

    const {
        namespace,
        op,
        shareId,
        contentVersion,
        ownerProfileId,
        objectId,
        operationId,
        requestHash,
    } = request;

    return (
        isOpaqueIdentifier(namespace) &&
        isShareContentOperation(op) &&
        isCanonicalBase64Url(shareId, SHARE_ID_BYTES) &&
        isSafeContentVersion(contentVersion) &&
        isOpaqueIdentifier(ownerProfileId) &&
        isOpaqueIdentifier(objectId) &&
        isOpaqueIdentifier(operationId) &&
        isSha256Hex(requestHash)
    );
};

const isSignatureValid = (verification: PresentationVerificationResult | undefined): boolean =>
    Boolean(
        verification &&
        Array.isArray(verification.errors) &&
        Array.isArray(verification.checks) &&
        verification.errors.length === 0 &&
        verification.checks.includes('JWS')
    );

/**
 * Build an authorization verifier over a fixed trust configuration.
 *
 * The returned `authorize(request, token)` is the only public entry point. It:
 *   1. denies everything when the configuration is empty/disabled;
 *   2. validates the expected request context;
 *   3. strictly parses the bounded JWT and applies the exact DID + key-method
 *      allowlist *before* calling the signature verifier;
 *   4. cryptographically verifies, then re-binds kid → signer DID → `iss` →
 *      `vp.holder` → signed `claims.iss`;
 *   5. validates purpose/audience/operation/time/nonce and exact request
 *      binding (including the canonical body hash);
 *   6. atomically consumes the nonce for the full remaining acceptance window,
 *      failing closed if the replay store errors.
 *
 * A fresh signed token (new `jti`) may retry the same idempotent operation;
 * request idempotency is a separate concern owned by the storage layer.
 */
export const createShareContentAuthorizationVerifier = (
    dependencies: CreateShareContentAuthorizationVerifierDependencies
): ShareContentAuthorizationVerifier => {
    const { config, verifyPresentation, replayStore } = dependencies;
    const now = dependencies.now ?? (() => Math.floor(Date.now() / 1000));

    const authorize = async (
        request: ShareContentAuthorizationRequest,
        token: string
    ): Promise<ShareContentAuthorizationResult> => {
        if (!isShareContentTrustConfigActive(config)) return { ok: false, reason: 'DISABLED' };
        if (!isValidAuthorizationRequest(request)) return { ok: false, reason: 'INVALID_REQUEST' };

        const parseResult = parseCompactJwt(token, config.maxTokenBytes);
        if (!parseResult.ok) return parseResult;

        const headerResult = validateShareContentJwtHeader(parseResult.parsed.header, config);
        if (!headerResult.ok) return headerResult;

        const { signerDid, verificationMethod } = headerResult.value;

        let verification: PresentationVerificationResult;

        try {
            verification = await verifyPresentation(token);
        } catch {
            return { ok: false, reason: 'SIGNATURE_INVALID' };
        }

        if (!isSignatureValid(verification)) return { ok: false, reason: 'SIGNATURE_INVALID' };

        const { payload } = parseResult.parsed;

        // Recheck every identity claim against the key that actually signed,
        // after cryptographic verification. Parsing alone never authenticates.
        if (payload.iss !== signerDid) return { ok: false, reason: 'SIGNER_MISMATCH' };

        const vp = payload.vp;
        if (!isPlainObject(vp) || vp.holder !== signerDid) {
            return { ok: false, reason: 'SIGNER_MISMATCH' };
        }

        const claimsResult = extractSignedClaims(payload);
        if (!claimsResult.ok) return claimsResult;

        const parsedClaims = parseShareContentAuthorizationClaims(claimsResult.raw, config);
        if (!parsedClaims.ok) return parsedClaims;

        const claims = parsedClaims.claims;

        if (claims.iss !== signerDid) return { ok: false, reason: 'SIGNER_MISMATCH' };
        if (claims.aud !== config.audience) return { ok: false, reason: 'AUDIENCE_MISMATCH' };
        if (claims.purpose !== SHARE_CONTENT_AUTH_PURPOSE) {
            return { ok: false, reason: 'PURPOSE_MISMATCH' };
        }

        const currentTime = now();
        if (!Number.isSafeInteger(currentTime)) return { ok: false, reason: 'INVALID_TTL' };

        const signedTtl = claims.exp - claims.iat;
        if (signedTtl <= 0 || signedTtl > config.maxTokenTtlSeconds) {
            return { ok: false, reason: 'INVALID_TTL' };
        }

        const { clockSkewSeconds } = config;

        if (currentTime > claims.exp + clockSkewSeconds)
            return { ok: false, reason: 'TOKEN_EXPIRED' };
        if (claims.iat > currentTime + clockSkewSeconds) {
            return { ok: false, reason: 'TOKEN_NOT_YET_VALID' };
        }

        // Exact expected context must match the signed claims before any replay
        // consumption, so a mismatched request can never burn a valid nonce.
        if (
            claims.namespace !== request.namespace ||
            claims.op !== request.op ||
            claims.shareId !== request.shareId ||
            claims.contentVersion !== request.contentVersion ||
            claims.ownerProfileId !== request.ownerProfileId ||
            claims.objectId !== request.objectId ||
            claims.operationId !== request.operationId
        ) {
            return { ok: false, reason: 'REQUEST_BINDING_MISMATCH' };
        }

        if (claims.requestHash !== request.requestHash) {
            return { ok: false, reason: 'REQUEST_HASH_MISMATCH' };
        }

        // Replay protection covers the whole acceptance window (expiry + skew).
        // `iat` may itself be up to `skew` in the future, so the maximum
        // derivable lifetime is maxTtl + 2 * skew.
        const replayTtlSeconds = claims.exp + clockSkewSeconds - currentTime;
        const maxReplayTtlSeconds = config.maxTokenTtlSeconds + 2 * clockSkewSeconds;

        if (replayTtlSeconds <= 0 || replayTtlSeconds > maxReplayTtlSeconds) {
            return { ok: false, reason: 'INVALID_TTL' };
        }

        const replayKey = `share-content-auth:jti:${createHash('sha256')
            .update(`${signerDid}\u0000${claims.jti}`, 'utf8')
            .digest('hex')}`;

        let consumed: boolean;

        try {
            consumed = await replayStore.consumeOnce(replayKey, replayTtlSeconds);
        } catch {
            // Fail closed: an unavailable replay store must never widen access.
            return { ok: false, reason: 'REPLAY_STORE_UNAVAILABLE' };
        }

        if (!consumed) return { ok: false, reason: 'REPLAY_DETECTED' };

        const context: ShareContentAuthorizationContext = {
            signerDid,
            verificationMethod,
            claims,
        };

        return { ok: true, context };
    };

    return { config, authorize };
};
