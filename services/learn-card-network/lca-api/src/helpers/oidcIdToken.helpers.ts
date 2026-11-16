/**
 * Shared OpenID Connect `id_token` verification used by the native Google/Apple
 * sign-in (`social-token.helpers.ts`) and ClassLink (`classlink.helpers.ts`).
 *
 * It owns the parts every provider must get right — a per-URI remote JWKS cache,
 * algorithm pinning, exact issuer and audience allowlists, required claims, and
 * `exp`/`nbf` checks (by jose) plus an optional `iat` freshness bound. Callers keep
 * their own claim schemas and error mapping: this helper throws jose's errors
 * unchanged so each caller can tell an invalid token from an unavailable provider
 * (see `isOidcProviderUnavailableError`).
 */
import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import type { JWTPayload, JWTVerifyGetKey } from 'jose';

const DEFAULT_JWKS_TIMEOUT_MS = 10_000;

const remoteJwksByUri = new Map<string, JWTVerifyGetKey>();

/**
 * A cached remote JWKS for `jwksUri`. jose's built-in cooldown bounds unknown-`kid`
 * refetches during invalid-token floods, so one resolver is kept per URI.
 */
export const getRemoteJwks = (
    jwksUri: string,
    { timeoutMs = DEFAULT_JWKS_TIMEOUT_MS }: { timeoutMs?: number } = {}
): JWTVerifyGetKey => {
    let jwks = remoteJwksByUri.get(jwksUri);
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(jwksUri), { timeoutDuration: timeoutMs });
        remoteJwksByUri.set(jwksUri, jwks);
    }
    return jwks;
};

export interface VerifyOidcIdTokenOptions {
    /** Key resolver, usually from `getRemoteJwks`. */
    jwks: JWTVerifyGetKey;
    /** Exact issuer allowlist. */
    issuers: string[];
    /** Exact audience (client ID) allowlist. */
    audiences: string[];
    /** Pinned signing algorithms; never include symmetric algorithms for a public JWKS. */
    algorithms: string[];
    /** Claims that must be present (in addition to jose's `exp`/`nbf` validation). */
    requiredClaims?: string[];
    /** When set, reject tokens whose `iat` is further than this from now, in either direction. */
    maxIatSkewSeconds?: number;
}

/** Thrown when `iat` is outside `maxIatSkewSeconds`. Its `code` is safe to log. */
export class OidcIatSkewError extends Error {
    readonly code = 'iat_skew';

    constructor() {
        super('Token issued-at time is outside the allowed window');
        this.name = 'OidcIatSkewError';
    }
}

/**
 * Verify an OIDC `id_token` signature and its standard claims and return the payload.
 * Throws jose errors (or `OidcIatSkewError`) unchanged; never logs.
 */
export const verifyOidcIdToken = async (
    token: string,
    options: VerifyOidcIdTokenOptions
): Promise<JWTPayload> => {
    const { payload } = await jwtVerify(token, options.jwks, {
        issuer: options.issuers,
        audience: options.audiences,
        algorithms: options.algorithms,
        requiredClaims: options.requiredClaims,
    });
    if (options.maxIatSkewSeconds !== undefined) {
        const iat = payload.iat;
        if (
            typeof iat !== 'number' ||
            Math.abs(Math.floor(Date.now() / 1000) - iat) > options.maxIatSkewSeconds
        )
            throw new OidcIatSkewError();
    }
    return payload;
};

/**
 * True when a verification error means the provider's key set could not be fetched
 * (network failure, timeout, non-200 or malformed JWKS), as opposed to a token that
 * is itself invalid. Unknown non-jose errors are treated as provider failures.
 */
export const isOidcProviderUnavailableError = (error: unknown): boolean => {
    if (error instanceof errors.JWKSTimeout || error instanceof errors.JWKSInvalid) return true;
    if (error instanceof errors.JOSEError)
        // jose reports a non-200 JWKS response as a generic JOSEError.
        return error.code === 'ERR_JOSE_GENERIC';
    return !(error instanceof OidcIatSkewError);
};
