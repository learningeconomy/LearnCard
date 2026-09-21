/**
 * LC-2187 Brain → LearnCloud share-content HTTP client types.
 *
 * This module defines the *transport* grammar for the fixed server-to-server
 * contract. It is deliberately local to brain-service: production must never
 * import LearnCloud runtime code, so the few shared literals (the six-field
 * tuple, the operation names, the request-hash canon) are restated here and
 * pinned by cross-implementation contract tests.
 *
 * The client never persists or logs the ciphertext, the owner recovery JWE, the
 * signed token or the claims. Every value that crosses this boundary is either a
 * non-secret binding or an already-encrypted opaque payload.
 */

/**
 * The exact operation allowlist. The operation is carried by the route, not the
 * request body, so it is a client-side parameter, never a body field.
 */
export const SHARE_CONTENT_OPERATIONS = ['put', 'get', 'stat', 'delete', 'readRecovery'] as const;

export type ShareContentOperation = (typeof SHARE_CONTENT_OPERATIONS)[number];

/** Signed purpose claim accepted by the C1 verifier. */
export const SHARE_CONTENT_AUTH_PURPOSE = 'lc-share-content/v1' as const;

/** Bound on the complete JSON request body. */
export const DEFAULT_MAX_SHARE_CONTENT_REQUEST_BYTES = 1024 * 1024;
/** Bound on the complete JSON response body. */
export const DEFAULT_MAX_SHARE_CONTENT_RESPONSE_BYTES = 2 * 1024 * 1024;
/** Maximum signed token lifetime in seconds; the contract caps this at 60. */
export const MAX_SHARE_CONTENT_TOKEN_TTL_SECONDS = 60;
export const DEFAULT_SHARE_CONTENT_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_SHARE_CONTENT_MAX_ATTEMPTS = 3;
export const DEFAULT_SHARE_CONTENT_RETRY_BACKOFF_MS = 200;
export const MAX_SHARE_CONTENT_RETRY_BACKOFF_MS = 5_000;

/** A256GCM envelope exactly as stored by LearnCloud. */
export type ShareContentEnvelope = {
    v: 1;
    alg: 'A256GCM';
    iv: string;
    ct: string;
};

/** Opaque owner-encrypted recovery JWE. Never interpreted by this module. */
export type ShareContentOwnerRecovery = Record<string, unknown>;

/**
 * The exact six-field immutable tuple. Every request — including `put` — carries
 * these fields and the route supplies the operation.
 */
export type ShareContentTuple = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
};

export type ShareContentPutRequest = ShareContentTuple & {
    envelope: ShareContentEnvelope;
    ownerEncryptedRecovery: ShareContentOwnerRecovery;
};

/** Claims signed into the JWT-VP `nonce`; mirrors the reviewed C1 claim list. */
export type ShareContentAuthorizationClaims = {
    iss: string;
    aud: string;
    purpose: typeof SHARE_CONTENT_AUTH_PURPOSE;
    namespace: string;
    op: ShareContentOperation;
    shareId: string;
    contentVersion: number;
    ownerProfileId: string;
    objectId: string;
    operationId: string;
    requestHash: string;
    iat: number;
    exp: number;
    jti: string;
};

/**
 * Injected signing adapter. The runtime implementation wraps the existing
 * did:web LearnCard primitives; tests inject a fake or a checked-in DIDKit
 * fixture. `claims` already contains a fresh CSPRNG `jti` and bounded times.
 */
export type ShareContentTokenSigner = (claims: ShareContentAuthorizationClaims) => Promise<string>;

/** Response value: active object summary (no ciphertext or recovery). */
export type ShareContentActiveSummary = {
    kind: 'active';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash: string;
    payloadHash: string;
    ciphertextBytes: number;
    recoveryBytes: number;
    createdAt: string;
};

/** Response value: permanent tombstone summary. */
export type ShareContentTombstoneSummary = {
    kind: 'tombstone';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash?: string;
    deletedAt: string;
};

export type ShareContentStatValue = ShareContentActiveSummary | ShareContentTombstoneSummary;

/** Response value for `put`. */
export type ShareContentPutValue = {
    status: 'created' | 'idempotent';
    record: ShareContentActiveSummary;
};

/** Response value for `get`: content projection, never owner recovery. */
export type ShareContentContentProjection = {
    kind: 'active';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash: string;
    payloadHash: string;
    envelope: ShareContentEnvelope;
    ciphertextBytes: number;
    createdAt: string;
};

/** Response value for `readRecovery`: owner-only projection, never ciphertext. */
export type ShareContentRecoveryProjection = {
    kind: 'active';
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectId: string;
    operationId: string;
    contentHash: string;
    payloadHash: string;
    ownerEncryptedRecovery: ShareContentOwnerRecovery;
    recoveryBytes: number;
    createdAt: string;
};

/** Response value for `delete`: the permanent tombstone. */
export type ShareContentDeleteValue = ShareContentTombstoneSummary;

/**
 * Stable, non-secret transport/repository codes. Routes and callers must map
 * every one to a generic external result; none of them carry token or body data.
 */
export type ShareContentClientErrorCode =
    | 'DISABLED'
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'PAYLOAD_TOO_LARGE'
    | 'UNAVAILABLE'
    | 'UNEXPECTED_STATUS'
    | 'MALFORMED_RESPONSE'
    | 'RESPONSE_TOO_LARGE'
    | 'RESPONSE_TUPLE_MISMATCH'
    | 'REDIRECT_REJECTED'
    | 'TIMEOUT'
    | 'NETWORK_ERROR'
    | 'SIGNING_FAILED';

export type ShareContentClientResult<T> =
    { ok: true; value: T } | { ok: false; error: ShareContentClientErrorCode };

/** Transport errors that a bounded retry (with a fresh token/jti) may re-attempt. */
export const TRANSIENT_SHARE_CONTENT_ERRORS: readonly ShareContentClientErrorCode[] = [
    'UNAVAILABLE',
    'TIMEOUT',
    'NETWORK_ERROR',
];

export const isTransientShareContentError = (code: ShareContentClientErrorCode): boolean =>
    TRANSIENT_SHARE_CONTENT_ERRORS.includes(code);

/** Configuration/validation failure raised before any network I/O. */
export class ShareContentClientConfigurationError extends Error {
    readonly code = 'SHARE_CONTENT_CLIENT_CONFIGURATION_ERROR';

    constructor(message: string) {
        super(message);
        this.name = 'ShareContentClientConfigurationError';
    }
}

export type ShareContentClientConfig = {
    /** Fail-closed switch. When false every operation returns `DISABLED`. */
    enabled: boolean;
    /** Trusted origin, e.g. `https://learncloud.example`. No path/query/userinfo. */
    origin: string;
    /** Explicit stable opaque namespace accepted by C1/C2 (no `%`/`:`). */
    namespace: string;
    /** LearnCloud service DID (the token audience). */
    audience: string;
    /** Brain service DID the signer is expected to sign as. */
    signerDid: string;
    /**
     * When true, a loopback `http://localhost`/`127.0.0.1`/`[::1]` origin is
     * accepted for local tests/development. The cryptographic auth path is
     * identical; there is never an unsigned bypass.
     */
    allowInsecureLoopback: boolean;
    signer: ShareContentTokenSigner;
    requestTimeoutMs: number;
    maxAttempts: number;
    retryBackoffMs: number;
    maxRequestBytes: number;
    maxResponseBytes: number;
    /** Epoch-milliseconds clock, injectable for deterministic tests. */
    now: () => number;
    /** Bound sleep, injectable so retry tests do not wait. */
    sleep: (ms: number) => Promise<void>;
    /** Injectable fetch for tests; defaults to the global fetch. */
    fetchImpl: typeof fetch;
};

export type ShareContentClient = {
    readonly config: ShareContentClientConfig;
    put: (
        request: ShareContentPutRequest
    ) => Promise<ShareContentClientResult<ShareContentPutValue>>;
    get: (
        request: ShareContentTuple
    ) => Promise<ShareContentClientResult<ShareContentContentProjection>>;
    stat: (request: ShareContentTuple) => Promise<ShareContentClientResult<ShareContentStatValue>>;
    delete: (
        request: ShareContentTuple
    ) => Promise<ShareContentClientResult<ShareContentDeleteValue>>;
    readRecovery: (
        request: ShareContentTuple
    ) => Promise<ShareContentClientResult<ShareContentRecoveryProjection>>;
};
