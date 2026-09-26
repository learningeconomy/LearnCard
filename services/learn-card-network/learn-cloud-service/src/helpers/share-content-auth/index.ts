/**
 * LC-2187 robust multi-credential sharing — LearnCloud service authorization.
 *
 * A narrow, reusable verifier foundation for the future service-only
 * `share_content` storage routes (put/get/stat/delete of exact immutable
 * objects plus the separate owner-recovery read intent). It is **not** wired to
 * any route or server entrypoint and reads no environment/secrets; callers
 * inject the trust configuration, DIDKit verification, clock and atomic replay
 * store.
 *
 * No plaintext keys, credentials or source URIs are handled here: the request
 * hash covers the opaque ciphertext envelope and the opaque owner-encrypted
 * recovery.
 */

export * from './types';
export {
    SHARE_ID_BYTES,
    extractSignedClaims,
    parseShareContentAuthorizationClaims,
} from './claims';
export {
    DEFAULT_MAX_CANONICAL_DEPTH,
    DEFAULT_MAX_CANONICAL_REQUEST_BYTES,
    ShareContentCanonicalizationError,
    canonicalizeShareContentRequestBody,
    computeShareContentRequestHash,
    isBoundedNonce,
    isCanonicalBase64Url,
    isOpaqueIdentifier,
    isPlainObject,
    isSafeContentVersion,
    isSafeEpochSecond,
    isSha256Hex,
    isShareContentOperation,
} from './canonical';
export {
    DEFAULT_MAX_JTI_LENGTH,
    DEFAULT_MAX_TOKEN_BYTES,
    DEFAULT_MIN_JTI_LENGTH,
    DISABLED_SHARE_CONTENT_TRUST_CONFIG,
    HARD_MAX_CLOCK_SKEW_SECONDS,
    HARD_MAX_TOKEN_BYTES,
    HARD_MAX_TOKEN_TTL_SECONDS,
    HARD_MIN_TOKEN_BYTES,
    isShareContentTrustConfigActive,
    resolveShareContentTrustConfig,
} from './config';
export { parseCompactJwt, validateShareContentJwtHeader } from './token';
export {
    createShareContentAuthorizationVerifier,
    type CreateShareContentAuthorizationVerifierDependencies,
} from './verifier';
export {
    createDidkitPresentationVerifier,
    createSetIfAbsentReplayStore,
    type LearnCardLike,
    type SetIfAbsent,
} from './adapters';
