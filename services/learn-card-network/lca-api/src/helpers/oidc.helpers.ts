/**
 * Minimal OIDC provider primitives for lca-api (AD-2 of the Keycloak
 * auth-provider migration).
 *
 * lca-api exposes a minimal OpenID Connect provider that Keycloak trusts as an
 * upstream Identity Provider (alias `lca-api`). This module owns the signing
 * key material, the discovery / JWKS documents, and the mint / verify
 * primitives for the `id_token` returned from the `/oidc/token` endpoint.
 *
 * Design notes (per the design of record):
 *  - The signing key is **separate from `SEED`** and rotated independently.
 *    Production/staging set `OIDC_SIGNING_KEY_JWK` to a JSON RSA private JWK
 *    (from Secrets Manager). When unset in production the provider fails closed
 *    (503) — it never falls back to a forgeable key. In dev/CI an ephemeral
 *    RSA keypair is generated once per process (random, never deterministic,
 *    never a function of `SEED`) so local Keycloak can round-trip.
 *  - RS256 is used because Keycloak's OIDC identity-provider brokering expects
 *    RSA signing keys by default.
 *  - Nothing here touches Mongo; it is pure crypto + config so it can be
 *    unit-tested in isolation (see `test/oidc.spec.ts`).
 */

import crypto from 'node:crypto';

import { environment } from '@environment';
import { TRPCError } from '@trpc/server';
import { SignJWT, calculateJwkThumbprint, exportJWK, importJWK } from 'jose';
import type { CryptoKey, JWK, JWTPayload } from 'jose';

/** The signing algorithm for self-issued OIDC tokens (Keycloak expects RSA). */
export const OIDC_SIGNING_ALG = 'RS256' as const;

/** Default lifetime (seconds) of a minted ID token. */
export const DEFAULT_ID_TOKEN_TTL_SECONDS = 300;

/** Default confidential relying-party client Keycloak brokers through. */
export const DEFAULT_OIDC_CLIENT_ID = 'keycloak-broker';

/** Claims carried by a self-issued OIDC ID token. */
export interface OidcIdTokenClaims extends JWTPayload {
    sub: string;
    iss: string;
    aud: string | string[];
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_number_verified?: boolean;
    name?: string;
    picture?: string;
}

interface OidcSigningKey {
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    publicJwk: JWK;
    kid: string;
}

let cachedKey: OidcSigningKey | undefined;
let cachedKeyMaterial: string | undefined;
let ephemeralDevJwk: JWK | undefined;

/** True when the service is running as a real production deployment. */
const isProduction = (): boolean =>
    environment.NODE_ENV === 'production' && !environment.IS_OFFLINE && !environment.IS_E2E_TEST;

/**
 * Resolve the RSA private JWK for the signing key.
 *
 * Production/staging set `OIDC_SIGNING_KEY_JWK` to a JSON RSA private JWK.
 * When unset in production the provider fails closed (503). In dev/CI a single
 * ephemeral RSA keypair is generated once per process — random, never
 * deterministic, and never derived from `SEED`.
 */
const resolveSigningJwk = (): { jwk: JWK; material: string } => {
    const configured = environment.OIDC_SIGNING_KEY_JWK?.trim();
    if (configured) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(configured);
        } catch {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'OIDC_SIGNING_KEY_JWK must be a JSON RSA private JWK',
            });
        }
        const jwk = parsed as JWK;
        if (
            !jwk ||
            jwk.kty !== 'RSA' ||
            typeof jwk.d !== 'string' ||
            !jwk.kid ||
            jwk.alg !== 'RS256'
        ) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'OIDC_SIGNING_KEY_JWK must be an RSA private JWK (kty=RSA with d)',
            });
        }
        return { jwk, material: `configured:${configured}` };
    }

    if (isProduction()) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'OIDC signing key is not configured',
        });
    }

    if (!ephemeralDevJwk) {
        const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        ephemeralDevJwk = privateKey.export({ format: 'jwk' }) as JWK;
        process.emitWarning('OIDC is using an ephemeral development signing key.');
    }
    return { jwk: ephemeralDevJwk, material: 'ephemeral-dev' };
};

/**
 * Resolve (and memoize) the OIDC signing key.
 *
 * Memoization is keyed on the resolved key material so tests that stub a
 * different `OIDC_SIGNING_KEY_JWK` transparently get a fresh key.
 */
export const getOidcSigningKey = async (): Promise<OidcSigningKey> => {
    const { jwk, material } = resolveSigningJwk();
    if (cachedKey && cachedKeyMaterial === material) return cachedKey;

    const privateKey = (await importJWK(jwk, OIDC_SIGNING_ALG)) as CryptoKey;
    const publicComponents: JWK = {
        kty: 'RSA',
        n: jwk.n,
        e: jwk.e,
    };
    const publicKey = (await importJWK(publicComponents, OIDC_SIGNING_ALG)) as CryptoKey;

    const publicJwk = await exportJWK(publicKey);
    const kid = jwk.kid ?? (await calculateJwkThumbprint(publicJwk));

    publicJwk.kid = kid;
    publicJwk.alg = jwk.alg ?? OIDC_SIGNING_ALG;
    publicJwk.use = 'sig';

    cachedKey = { privateKey, publicKey, publicJwk, kid };
    cachedKeyMaterial = material;

    return cachedKey;
};

/** Clear the memoized signing key. Intended for isolated tests only. */
export const resetOidcSigningKeyForTests = (): void => {
    cachedKey = undefined;
    cachedKeyMaterial = undefined;
};

/**
 * The configured issuer identifier for this provider. Required — there is no
 * default, so a misconfigured production deployment fails closed rather than
 * minting tokens under a wrong issuer.
 */
export const getOidcIssuer = (): string => {
    const issuer = environment.OIDC_ISSUER;
    if (!issuer) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'OIDC issuer is not configured',
        });
    }
    return issuer;
};

/**
 * The confidential relying-party client Keycloak uses at the token endpoint.
 * `id_token`s are minted with this client id as their audience so a token can
 * only be consumed by the intended relying party.
 */
export const getOidcClientId = (): string => environment.OIDC_CLIENT_ID || DEFAULT_OIDC_CLIENT_ID;

const splitCsv = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

/**
 * The exact redirect URIs the authorization endpoint will honor. `OIDC_REDIRECT_URIS`
 * overrides; otherwise each `KEYCLOAK_ISSUERS` entry resolves to its single fixed
 * broker callback `${issuer}/broker/lca-api/endpoint`. Prefixes are never accepted.
 */
export const getOidcRedirectUris = (): string[] => {
    const explicit = splitCsv(environment.OIDC_REDIRECT_URIS);
    if (explicit.length > 0) return explicit;
    return splitCsv(environment.KEYCLOAK_ISSUERS).map(
        issuer => `${issuer}/broker/lca-api/endpoint`
    );
};

/**
 * Validate the confidential client's credentials at the token endpoint using a
 * timing-safe comparison. In production `OIDC_CLIENT_SECRET` MUST be set; when
 * it is unset (dev/CI only) the token endpoint refuses client authentication.
 */
export const verifyOidcClientCredentials = (clientId: string, clientSecret: string): boolean => {
    const expectedSecret = environment.OIDC_CLIENT_SECRET;
    if (!expectedSecret) return false;
    if (clientId !== getOidcClientId()) return false;

    const provided = Buffer.from(clientSecret);
    const expected = Buffer.from(expectedSecret);
    if (provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(provided, expected);
};

/**
 * Require exact string equality; an empty allowlist rejects every redirect.
 */
export const isAllowedRedirectUri = (redirectUri: string): boolean => {
    let candidate: URL;
    try {
        candidate = new URL(redirectUri);
    } catch {
        return false;
    }
    if (candidate.protocol !== 'https:' && candidate.protocol !== 'http:') return false;

    return getOidcRedirectUris().includes(redirectUri);
};

/** The public JWKS document (single active signing key). */
export const getOidcJwks = async (): Promise<{ keys: JWK[] }> => {
    const { publicJwk } = await getOidcSigningKey();
    return { keys: [publicJwk] };
};

/** The OIDC discovery document served at `/.well-known/openid-configuration`. */
export const getOidcDiscoveryDocument = (): Record<string, unknown> => {
    const issuer = getOidcIssuer();
    return {
        issuer,
        authorization_endpoint: `${issuer}/oidc/authorize`,
        token_endpoint: `${issuer}/oidc/token`,
        jwks_uri: `${issuer}/oidc/jwks`,
        userinfo_endpoint: `${issuer}/oidc/userinfo`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: [OIDC_SIGNING_ALG],
        scopes_supported: ['openid', 'email', 'phone', 'profile'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
        grant_types_supported: ['authorization_code'],
        claims_supported: [
            'sub',
            'iss',
            'aud',
            'exp',
            'iat',
            'email',
            'email_verified',
            'phone_number',
            'phone_number_verified',
            'name',
            'picture',
        ],
    };
};

/** Mint a signed OIDC ID token whose audience is the confidential client. */
export const mintIdToken = async (params: {
    subject: string;
    nonce?: string;
    ttlSeconds?: number;
    email?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    name?: string;
    picture?: string;
}): Promise<{ token: string; expiresAt: number }> => {
    const { privateKey, kid } = await getOidcSigningKey();
    const issuer = getOidcIssuer();
    const audience = getOidcClientId();
    const now = Math.floor(Date.now() / 1000);
    const ttl = params.ttlSeconds ?? DEFAULT_ID_TOKEN_TTL_SECONDS;
    const expiresAt = now + ttl;

    const claims: OidcIdTokenClaims = {
        sub: params.subject,
        iss: issuer,
        aud: audience,
    };
    if (params.nonce !== undefined) claims.nonce = params.nonce;
    if (params.email !== undefined) claims.email = params.email;
    if (params.emailVerified !== undefined) claims.email_verified = params.emailVerified;
    if (params.phoneNumber !== undefined) claims.phone_number = params.phoneNumber;
    if (params.phoneNumberVerified !== undefined) {
        claims.phone_number_verified = params.phoneNumberVerified;
    }
    if (params.name !== undefined) claims.name = params.name;
    if (params.picture !== undefined) claims.picture = params.picture;

    const token = await new SignJWT(claims)
        .setProtectedHeader({ alg: OIDC_SIGNING_ALG, kid, typ: 'JWT' })
        .setIssuedAt(now)
        .setExpirationTime(expiresAt)
        .sign(privateKey);

    return { token, expiresAt };
};
