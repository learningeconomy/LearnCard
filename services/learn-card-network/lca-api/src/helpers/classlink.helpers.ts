import axios from 'axios';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import cache from '@cache';
import { getClassLinkConfig } from './classlink.config';
import { ClassLinkEmailMissing, ClassLinkTokenInvalid } from './classlink.errors';
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

/** Fetch provider metadata with a one-hour, discovery-URL-scoped cache. */
export const getClassLinkDiscovery = async (): Promise<z.infer<typeof discoveryValidator>> => {
    try {
        const { discoveryUrl } = requireConfig();
        const key = `classlink:discovery:${discoveryUrl}`;
        const cached = await cache.get(key);
        if (cached) return discoveryValidator.parse(JSON.parse(cached));
        const { data } = await axios.get(discoveryUrl, { timeout: 10000, maxRedirects: 0 });
        const discovery = discoveryValidator.parse(data);
        await cache.set(key, JSON.stringify(discovery), 3600);
        return discovery;
    } catch {
        throw new ClassLinkTokenInvalid();
    }
};

/** Exchange the authorization code server-side without exposing upstream request errors. */
export const exchangeClassLinkCode = async ({
    code,
    codeVerifier,
    redirectUri,
}: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
}): Promise<z.infer<typeof tokenResponseValidator>> => {
    try {
        const config = requireConfig();
        if (!code || !codeVerifier || !config.redirectUris.includes(redirectUri)) {
            throw new ClassLinkTokenInvalid();
        }
        const discovery = await getClassLinkDiscovery();
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
        logVerifyFailure('exchange', error);
        // Axios errors can retain the secret-bearing form body; never propagate their cause.
        throw new ClassLinkTokenInvalid();
    }
};

let remoteKeys: { uri: string; resolve: ReturnType<typeof createRemoteJWKSet> } | undefined;

/** Verify signatures and all identity bindings before returning any provider claims. */
export const verifyClassLinkIdToken = async (
    idToken: string,
    { nonce }: { nonce: string }
): Promise<ClassLinkClaims> => {
    try {
        const config = requireConfig();
        const discovery = await getClassLinkDiscovery();
        if (!remoteKeys || remoteKeys.uri !== discovery.jwks_uri) {
            remoteKeys = {
                uri: discovery.jwks_uri,
                // Keep jose's cooldown to bound unknown-kid fetches during invalid-token floods.
                resolve: createRemoteJWKSet(new URL(discovery.jwks_uri), {
                    timeoutDuration: 10000,
                }),
            };
        }
        const { payload } = await jwtVerify(idToken, remoteKeys.resolve, {
            issuer: [discovery.issuer, ...CLASSLINK_TOKEN_ISSUERS],
            audience: config.clientId,
            algorithms: ['RS256'],
            requiredClaims: ['exp', 'iat', 'sub'],
        });
        const claims = claimsValidator.parse(payload);
        if (
            !nonce ||
            claims.nonce !== nonce ||
            Math.abs(Math.floor(Date.now() / 1000) - claims.iat) > 300
        ) {
            logVerifyFailure('binding', {
                code: !nonce || claims.nonce !== nonce ? 'nonce' : 'iat_skew',
            });
            throw new ClassLinkTokenInvalid();
        }
        return claims;
    } catch (error) {
        if (!(error instanceof ClassLinkTokenInvalid)) logVerifyFailure('verify', error);
        // Validation and JOSE errors may carry raw claims. Do not log or retain them.
        throw new ClassLinkTokenInvalid();
    }
};

/** Extract a normalized school email only from already verified claims. */
export const getClassLinkEmail = (claims: ClassLinkClaims): string | null => {
    if (claims.email_verified === false) throw new ClassLinkEmailMissing();
    return (claims.email?.trim() || claims.or_email?.trim())?.toLowerCase() || null;
};
