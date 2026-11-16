import axios from 'axios';
import { z } from 'zod';
import cache from '@cache';
import { getClassLinkConfig } from './classlink.config';
import {
    ClassLinkEmailMissing,
    ClassLinkProviderUnavailable,
    ClassLinkTokenInvalid,
} from './classlink.errors';
import {
    getRemoteJwks,
    isOidcProviderUnavailableError,
    OidcIatSkewError,
    verifyOidcIdToken,
} from './oidcIdToken.helpers';
import type { ClassLinkClaims, ClassLinkConfig } from 'types/classlink';

export type { ClassLinkClaims } from 'types/classlink';

const discoveryValidator = z.object({
    issuer: z.string().url(),
    authorization_endpoint: z.string().url(),
    token_endpoint: z.string().url(),
    jwks_uri: z.string().url(),
});
const tokenResponseValidator = z.object({
    id_token: z.string().min(1),
    access_token: z.string().min(1).optional(),
    token_type: z.string().min(1).optional(),
    expires_in: z.number().nonnegative().optional(),
});
const nonblank = z.string().refine(value => value.trim().length > 0);
// ClassLink sends some identifiers (e.g. classLink_tenant_id) as numbers; normalize to strings.
const identifier = z
    .union([nonblank, z.number().int().nonnegative()])
    .transform(value => String(value));

/**
 * ClassLink's discovery document advertises `https://launchpad.classlink.com`, but its
 * id_tokens are issued by `tokens-public.apis.classlink.com` (per ClassLink's docs).
 */
const CLASSLINK_TOKEN_ISSUERS = [
    'tokens-public.apis.classlink.com',
    'https://tokens-public.apis.classlink.com',
];

/** Allowed difference between a token's `iat` and now, in seconds. */
const MAX_IAT_SKEW_SECONDS = 300;

/** Log only a failure category and claim/field names; never token or claim values. */
const logVerifyFailure = (stage: string, error: unknown): void => {
    const detail: Record<string, unknown> = { stage };
    if (error instanceof z.ZodError)
        detail.fields = error.issues.map(issue => issue.path.join('.'));
    else if (error && typeof error === 'object') {
        if ('code' in error && typeof error.code === 'string') detail.reason = error.code;
        if ('claim' in error && typeof error.claim === 'string') detail.claim = error.claim;
        if ('response' in error && error.response && typeof error.response === 'object') {
            const response = error.response as { status?: unknown; data?: unknown };
            if (typeof response.status === 'number') detail.httpStatus = response.status;
            const data = response.data as { error?: unknown } | undefined;
            if (data && typeof data.error === 'string') detail.oauthError = data.error;
        }
    }
    console.warn('classlink.verify.failed', detail);
};

/**
 * Report a ClassLink outage (network failure, timeout, 5xx, client-registration error or
 * malformed provider response) and return the error to throw. Logs only the stage, the
 * error name/code and the HTTP status — never tokens, codes, secrets, emails or bodies —
 * so the line is safe to alert on.
 */
const providerUnavailable = (stage: string, error: unknown): ClassLinkProviderUnavailable => {
    const detail: Record<string, unknown> = { stage };
    if (error instanceof z.ZodError) detail.name = 'ZodError';
    else if (error && typeof error === 'object') {
        if ('name' in error && typeof error.name === 'string') detail.name = error.name;
        if ('code' in error && typeof error.code === 'string') detail.code = error.code;
        if ('response' in error && error.response && typeof error.response === 'object') {
            const response = error.response as { status?: unknown; data?: unknown };
            if (typeof response.status === 'number') detail.httpStatus = response.status;
            const data = response.data as { error?: unknown } | undefined;
            if (data && typeof data.error === 'string') detail.oauthError = data.error;
        }
    }
    console.error('classlink.provider.unavailable', detail);
    return new ClassLinkProviderUnavailable();
};

/** OAuth errors that mean our client registration is broken, not that the user's code is bad. */
const CLIENT_CONFIGURATION_ERRORS = new Set(['invalid_client', 'unauthorized_client']);

/**
 * Whether a token-endpoint failure was caused by the request itself (bad, reused or
 * expired code, PKCE mismatch: an OAuth 4xx) rather than by ClassLink or our client setup.
 */
const isTokenRequestRejected = (error: unknown): boolean => {
    if (!error || typeof error !== 'object' || !('response' in error)) return false;
    const response = error.response as { status?: unknown; data?: unknown } | undefined;
    if (!response || typeof response.status !== 'number') return false;
    if (response.status < 400 || response.status >= 500) return false;
    const data = response.data as { error?: unknown } | undefined;
    return !(data && typeof data.error === 'string' && CLIENT_CONFIGURATION_ERRORS.has(data.error));
};

const claimsValidator = z
    .object({
        iss: nonblank,
        aud: z.union([nonblank, z.array(nonblank).min(1)]),
        sub: nonblank,
        exp: z.number().finite(),
        iat: z.number().finite(),
        nonce: nonblank,
        classLink_tenant_id: identifier,
        classLink_sourcedId: identifier,
        classLink_role: z.string().optional(),
        auth_time: z.number().finite().optional(),
        email: z.string().optional(),
        or_email: z.string().optional(),
        email_verified: z.boolean().optional(),
        api_fields: z.unknown().optional(),
    })
    .passthrough();

const requireConfig = (): ClassLinkConfig => {
    const config = getClassLinkConfig();
    if (!config) throw new ClassLinkTokenInvalid();
    return config;
};

/**
 * Fetch provider metadata with a one-hour, discovery-URL-scoped cache. Throws
 * `ClassLinkTokenInvalid` when unconfigured and `ClassLinkProviderUnavailable` when the
 * document cannot be fetched or is malformed.
 */
export const getClassLinkDiscovery = async (): Promise<z.infer<typeof discoveryValidator>> => {
    const { discoveryUrl } = requireConfig();
    try {
        const key = `classlink:discovery:${discoveryUrl}`;
        const cached = await cache.get(key);
        if (cached) return discoveryValidator.parse(JSON.parse(cached));
        const { data } = await axios.get(discoveryUrl, { timeout: 10000, maxRedirects: 0 });
        const discovery = discoveryValidator.parse(data);
        await cache.set(key, JSON.stringify(discovery), 3600);
        return discovery;
    } catch (error) {
        throw providerUnavailable('discovery', error);
    }
};

/**
 * Exchange the authorization code server-side without exposing upstream request errors.
 * A rejected code (OAuth 4xx) is `ClassLinkTokenInvalid`; network failures, timeouts, 5xx,
 * client-registration errors and malformed responses are `ClassLinkProviderUnavailable`.
 * Neither retains the upstream error as a cause.
 */
export const exchangeClassLinkCode = async ({
    code,
    codeVerifier,
    redirectUri,
}: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
}): Promise<z.infer<typeof tokenResponseValidator>> => {
    const config = requireConfig();
    if (!code || !codeVerifier || !config.redirectUris.includes(redirectUri)) {
        throw new ClassLinkTokenInvalid();
    }
    const discovery = await getClassLinkDiscovery();
    try {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
        });
        const { data } = await axios.post(discovery.token_endpoint, body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
            maxRedirects: 0,
        });
        return tokenResponseValidator.parse(data);
    } catch (error) {
        // Axios errors can retain the secret-bearing form body; never propagate their cause.
        if (isTokenRequestRejected(error)) {
            logVerifyFailure('exchange', error);
            throw new ClassLinkTokenInvalid();
        }
        throw providerUnavailable('exchange', error);
    }
};

/**
 * Verify signatures and all identity bindings before returning any provider claims.
 * Uses the shared OIDC verifier (JWKS cache, RS256 pinning, iss/aud/exp/iat checks).
 * Throws `ClassLinkTokenInvalid` for a bad token and `ClassLinkProviderUnavailable` when
 * discovery or the JWKS cannot be fetched.
 */
export const verifyClassLinkIdToken = async (
    idToken: string,
    { nonce }: { nonce: string }
): Promise<ClassLinkClaims> => {
    const config = requireConfig();
    const discovery = await getClassLinkDiscovery();
    try {
        const payload = await verifyOidcIdToken(idToken, {
            jwks: getRemoteJwks(discovery.jwks_uri),
            issuers: [discovery.issuer, ...CLASSLINK_TOKEN_ISSUERS],
            audiences: [config.clientId],
            algorithms: ['RS256'],
            requiredClaims: ['exp', 'iat', 'sub'],
            maxIatSkewSeconds: MAX_IAT_SKEW_SECONDS,
        });
        const claims = claimsValidator.parse(payload);
        if (!nonce || claims.nonce !== nonce) {
            logVerifyFailure('binding', { code: 'nonce' });
            throw new ClassLinkTokenInvalid();
        }
        return claims;
    } catch (error) {
        if (error instanceof ClassLinkTokenInvalid) throw error;
        if (error instanceof OidcIatSkewError) {
            logVerifyFailure('binding', { code: 'iat_skew' });
            throw new ClassLinkTokenInvalid();
        }
        if (!(error instanceof z.ZodError) && isOidcProviderUnavailableError(error))
            throw providerUnavailable('jwks', error);
        logVerifyFailure('verify', error);
        // Validation and JOSE errors may carry raw claims. Do not log or retain them.
        throw new ClassLinkTokenInvalid();
    }
};

/** Extract a normalized school email only from already verified claims. */
export const getClassLinkEmail = (claims: ClassLinkClaims): string | null => {
    if (claims.email_verified === false) throw new ClassLinkEmailMissing();
    return (claims.email?.trim() || claims.or_email?.trim())?.toLowerCase() || null;
};
