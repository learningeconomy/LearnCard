/**
 * LC-2187 — Brain → LearnCloud share-content service authorization types.
 *
 * This module is a reusable authorization *verifier foundation*. It is not
 * registered on any router and it does not read the environment. Callers inject
 * the trust configuration, the presentation verifier, the clock and the atomic
 * replay store, so the unit tests exercise the real module without Redis,
 * MongoDB, did:web resolution or unfinished storage/schema work.
 */

/** Signed purpose claim. V1 is the only accepted value. */
export const SHARE_CONTENT_AUTH_PURPOSE = 'lc-share-content/v1' as const;

/**
 * Least-privilege operation allowlist. There is deliberately no `list`,
 * `deleteOwner` or other wildcard/collection-wide privilege: every token is
 * bound to exactly one immutable object. `readRecovery` is the separate
 * owner-encrypted recovery read intent.
 */
export const SHARE_CONTENT_OPERATIONS = ['put', 'get', 'stat', 'delete', 'readRecovery'] as const;

export type ShareContentOperation = (typeof SHARE_CONTENT_OPERATIONS)[number];

/** Every key that may appear in the signed claims object. Unknown keys are rejected. */
export const SHARE_CONTENT_CLAIM_FIELDS = [
    'iss',
    'aud',
    'purpose',
    'namespace',
    'op',
    'shareId',
    'contentVersion',
    'ownerProfileId',
    'objectId',
    'operationId',
    'requestHash',
    'iat',
    'exp',
    'jti',
] as const;

export type ShareContentClaimField = (typeof SHARE_CONTENT_CLAIM_FIELDS)[number];

/** Claims signed by Brain and re-validated by LearnCloud. */
export type ShareContentAuthorizationClaims = {
    /** Issuer = holder = the allowlisted Brain service DID. */
    iss: string;
    /** LearnCloud service DID. */
    aud: string;
    purpose: typeof SHARE_CONTENT_AUTH_PURPOSE;
    /** Service/network namespace (tenant or deployment scope). */
    namespace: string;
    op: ShareContentOperation;
    /** 16-byte canonical base64url share id (22 chars). */
    shareId: string;
    contentVersion: number;
    /** Opaque profile id. Existing ids are opaque strings, not necessarily UUIDs. */
    ownerProfileId: string;
    /** Immutable object identity for this exact content version. */
    objectId: string;
    /** Operation/idempotency identity. */
    operationId: string;
    /** Lowercase hex SHA-256 of the canonical full request body, incl. opaque recovery. */
    requestHash: string;
    iat: number;
    exp: number;
    /** CSPRNG nonce; single-use. */
    jti: string;
};

/**
 * The exact request context the token must be bound to. Callers build this from
 * the validated route input; `requestHash` is produced with
 * `computeShareContentRequestHash`.
 */
export type ShareContentAuthorizationRequest = {
    namespace: string;
    op: ShareContentOperation;
    shareId: string;
    contentVersion: number;
    ownerProfileId: string;
    objectId: string;
    operationId: string;
    requestHash: string;
};

/** Minimal authenticated context returned on success. Never contains the raw token. */
export type ShareContentAuthorizationContext = {
    signerDid: string;
    /** Full `kid` verification method that signed the presentation. */
    verificationMethod: string;
    claims: ShareContentAuthorizationClaims;
};

/** Result shape of the existing DIDKit `verifyPresentation(..., { proofFormat: 'jwt' })`. */
export type PresentationVerificationResult = {
    checks: string[];
    warnings: string[];
    errors: string[];
};

/** Injected DIDKit adapter. The module never resolves keys itself. */
export type PresentationVerifier = (token: string) => Promise<PresentationVerificationResult>;

/**
 * Injected atomic replay store. `consumeOnce` must be a single atomic
 * SET-if-absent (e.g. Redis `SET key value NX EX ttl`) and must throw when the
 * backing store is unavailable so the verifier can fail closed.
 */
export type ReplayStore = {
    consumeOnce: (key: string, ttlSeconds: number) => Promise<boolean>;
};

/**
 * Explicit trust configuration. An empty/disabled configuration denies all
 * access (fail closed). There is deliberately no offline bypass flag.
 *
 * Key rotation assumptions (document-backed, not yet integration-tested):
 * - A `did:web` identifier is stable across signing-seed rotation; the
 *   verification method fragment in the JWT `kid` is what changes.
 * - Operators must add the new verification method to
 *   `allowedVerificationMethods` *before* the new key signs, and keep the old
 *   entry for at least `maxTokenTtlSeconds + 2 * clockSkewSeconds` after the
 *   last token signed by the old key.
 * - did:web DID-document/resolver cache propagation must be validated in the
 *   integration batch; this module never resolves a DID itself.
 */
export type ShareContentTrustConfig = {
    enabled: boolean;
    /** LearnCloud's own service DID. Must be non-empty when enabled. */
    audience: string;
    /** Exact allowed Brain service DIDs. A user DID must never be listed. */
    allowedServiceDids: readonly string[];
    /**
     * Exact allowed verification methods (full `kid` values). Required: a DID
     * alone does not authorize a key. Empty disables access.
     */
    allowedVerificationMethods: readonly string[];
    /** Accepted JWS algorithms. Defaults to `EdDSA` only. */
    allowedAlgorithms: readonly string[];
    /** Bounded clock skew, seconds. */
    clockSkewSeconds: number;
    /** Maximum signed lifetime (`exp - iat`), seconds. Never above 60. */
    maxTokenTtlSeconds: number;
    /** Maximum raw token size in bytes. */
    maxTokenBytes: number;
    minJtiLength: number;
    maxJtiLength: number;
};

/**
 * Rejection reasons are stable, non-secret codes. Routes must map every one of
 * them to a single generic external rejection; they must never be logged
 * alongside token or claim payloads.
 */
export type ShareContentAuthorizationRejectionReason =
    | 'DISABLED'
    | 'INVALID_REQUEST'
    | 'TOKEN_TOO_LARGE'
    | 'MALFORMED_TOKEN'
    | 'UNSUPPORTED_HEADER'
    | 'UNSUPPORTED_ALGORITHM'
    | 'MISSING_KID'
    | 'UNKNOWN_SIGNER'
    | 'UNKNOWN_VERIFICATION_METHOD'
    | 'SIGNATURE_INVALID'
    | 'SIGNER_MISMATCH'
    | 'MALFORMED_CLAIMS'
    | 'UNKNOWN_CLAIM_FIELD'
    | 'INVALID_CLAIMS'
    | 'INVALID_SHARE_ID'
    | 'INVALID_IDENTIFIER'
    | 'INVALID_JTI'
    | 'AUDIENCE_MISMATCH'
    | 'PURPOSE_MISMATCH'
    | 'OPERATION_NOT_ALLOWED'
    | 'INVALID_TTL'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_NOT_YET_VALID'
    | 'REQUEST_BINDING_MISMATCH'
    | 'REQUEST_HASH_MISMATCH'
    | 'REPLAY_DETECTED'
    | 'REPLAY_STORE_UNAVAILABLE';

export type ShareContentAuthorizationResult =
    | { ok: true; context: ShareContentAuthorizationContext }
    | { ok: false; reason: ShareContentAuthorizationRejectionReason };

export type ShareContentAuthorizationVerifier = {
    config: ShareContentTrustConfig;
    authorize: (
        request: ShareContentAuthorizationRequest,
        token: string
    ) => Promise<ShareContentAuthorizationResult>;
};
