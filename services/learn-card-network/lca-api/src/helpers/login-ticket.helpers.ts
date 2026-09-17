/**
 * Login tickets, authorization codes, and opaque access tokens for the lca-api
 * OIDC provider (AD-2).
 *
 * Three short-lived, one-time-use artifacts back the "silent hop" login:
 *  - A **login ticket** is minted after lca-api proves ownership of a contact
 *    method / federated identity (email code, native Google/Apple). It carries
 *    the verified claims and the stable subject id.
 *  - An **authorization code** is minted by `/oidc/authorize` when it redeems a
 *    login ticket (passed by Keycloak as `login_hint`). Keycloak exchanges the
 *    code at `/oidc/token` for the signed `id_token`. The code is bound to the
 *    client + redirect URI it was issued for.
 *  - An **opaque access token** is minted alongside the id_token so Keycloak's
 *    broker can call `/oidc/userinfo`. It maps to the same verified claims.
 *
 * All live in the cache (Redis in prod, in-memory mock in tests) with short
 * TTLs. Tickets and codes are consumed (read-then-delete) so neither can be
 * replayed; the access token is read-only for its short life.
 */

import crypto from 'node:crypto';

import cache from '@cache';

export const AUTH_CODE_PREFIX = 'oidc-code:';
export const ACCESS_TOKEN_PREFIX = 'oidc:access:';

export const AUTH_CODE_TTL_SECONDS = 60;
export const ACCESS_TOKEN_TTL_SECONDS = 300;

export interface SubjectClaims {
    subject: string;
    email?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    name?: string;
    picture?: string;
}

export interface AuthorizationCodeData extends SubjectClaims {
    scope: string;
    code: string;
    clientId: string;
    redirectUri: string;
    nonce?: string;
    state?: string;
    createdAt: number;
}

export interface AccessTokenData extends SubjectClaims {
    createdAt: number;
}

const codeKey = (code: string): string => `${AUTH_CODE_PREFIX}${code}`;
const accessKey = (accessToken: string): string => `${ACCESS_TOKEN_PREFIX}${accessToken}`;

export const generateAuthorizationCode = (): string => crypto.randomBytes(32).toString('base64url');
export const generateAccessToken = (): string => crypto.randomBytes(32).toString('base64url');

/**
 * Atomically read-and-delete a value so it can only ever be consumed once.
 * Redis `GETDEL` is a single atomic command, so concurrent redemptions can only
 * return the value to exactly one caller — closing the read-then-delete race.
 */
const getDelete = async (key: string): Promise<string | null> => {
    const redis = cache.redis ?? cache.node;
    return redis.getdel(key);
};

export const storeAuthorizationCode = async (
    data: AuthorizationCodeData,
    ttl = AUTH_CODE_TTL_SECONDS
): Promise<void> => {
    await cache.set(codeKey(data.code), JSON.stringify(data), ttl);
};

export const consumeAuthorizationCode = async (
    code: string
): Promise<AuthorizationCodeData | null> => {
    const raw = await getDelete(codeKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as AuthorizationCodeData;
};

export const storeAccessToken = async (
    accessToken: string,
    data: AccessTokenData,
    ttl = ACCESS_TOKEN_TTL_SECONDS
): Promise<void> => {
    await cache.set(accessKey(accessToken), JSON.stringify(data), ttl);
};

export const getAccessToken = async (accessToken: string): Promise<AccessTokenData | null> => {
    const raw = await cache.get(accessKey(accessToken));
    if (!raw) return null;
    return JSON.parse(raw) as AccessTokenData;
};
