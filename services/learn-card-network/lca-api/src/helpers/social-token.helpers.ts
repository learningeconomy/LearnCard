/**
 * Native Google / Apple `id_token` verification for the lca-api auth router
 * (AD-2 / AD-3).
 *
 * The native app obtains an Apple/Google `id_token` through the platform SDK
 * and posts it here. We verify it against the provider's published JWKS — exact
 * issuer + audience (client id) allowlists, signature, `exp`/`nbf` — before
 * issuing a login ticket. A test seam (`setSocialJwksResolverForTests`) swaps
 * the remote JWKS for a local key set so the flow is unit-testable without
 * network access.
 */

import { environment } from '@environment';
import { TRPCError } from '@trpc/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

export type SocialProviderId = 'google' | 'apple';

export interface SocialProviderConfig {
    issuers: string[];
    audiences: string[];
    jwksUri: string;
}

export interface SocialClaims {
    sub: string;
    iss: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
}

const GOOGLE_DEFAULT_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_DEFAULT_ISSUERS = ['https://appleid.apple.com'];
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

const claimsSchema = z
    .object({
        sub: z.string().min(1),
        iss: z.string().min(1),
        email: z.string().min(1).optional(),
        email_verified: z.union([z.boolean(), z.string()]).optional(),
        name: z.string().optional(),
        picture: z.string().optional(),
    })
    .passthrough();

const splitCsv = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

export const getSocialProviderConfig = (
    provider: SocialProviderId
): SocialProviderConfig | null => {
    if (provider === 'google') {
        const audiences = splitCsv(environment.GOOGLE_OAUTH_CLIENT_IDS);
        if (audiences.length === 0) return null;
        return {
            audiences,
            issuers: GOOGLE_DEFAULT_ISSUERS,
            jwksUri: GOOGLE_JWKS_URI,
        };
    }

    const audiences = splitCsv(environment.APPLE_OAUTH_CLIENT_IDS);
    if (audiences.length === 0) return null;
    return {
        audiences,
        issuers: APPLE_DEFAULT_ISSUERS,
        jwksUri: APPLE_JWKS_URI,
    };
};

const jwksByUri = new Map<string, JWTVerifyGetKey>();
let resolverForTests: ((jwksUri: string) => JWTVerifyGetKey) | undefined;

export const setSocialJwksResolverForTests = (
    resolver: ((jwksUri: string) => JWTVerifyGetKey) | undefined
): void => {
    resolverForTests = resolver;
    jwksByUri.clear();
};

export const getSocialJwks = (jwksUri: string): JWTVerifyGetKey => {
    let jwks = jwksByUri.get(jwksUri);
    if (!jwks) {
        jwks = resolverForTests ? resolverForTests(jwksUri) : createRemoteJWKSet(new URL(jwksUri));
        jwksByUri.set(jwksUri, jwks);
    }
    return jwks;
};

export const verifySocialIdToken = async (
    provider: SocialProviderId,
    token: string
): Promise<SocialClaims> => {
    const config = getSocialProviderConfig(provider);
    if (!config) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: `Sign-in with ${provider} is not configured.`,
        });
    }

    let payload: unknown;
    try {
        ({ payload } = await jwtVerify(token, getSocialJwks(config.jwksUri), {
            issuer: config.issuers,
            audience: config.audiences,
            algorithms: ['RS256', 'ES256'],
            requiredClaims: ['sub', 'exp', 'email', 'email_verified'],
        }));
    } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid social token' });
    }

    const result = claimsSchema.safeParse(payload);
    if (!result.success) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid social token' });
    }

    const claims = result.data;
    const emailVerified =
        claims.email_verified === true ||
        (provider === 'apple' && claims.email_verified === 'true');
    if (!claims.email || !emailVerified) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid social token' });
    }

    return {
        sub: claims.sub,
        iss: claims.iss,
        email: claims.email,
        email_verified: emailVerified,
        name: claims.name,
        picture: claims.picture,
    };
};
