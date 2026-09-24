import { environment } from '@environment';
import { TRPCError } from '@trpc/server';
import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

export interface KeycloakVerifyOptions {
    issuers: string[];
    audiences: string[];
}

export interface KeycloakClaims {
    sub: string;
    iss: string;
    typ?: string;
    azp?: string;
    aud?: string | string[];
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_number_verified?: boolean;
    name?: string;
    picture?: string;
}

const claimsSchema = z.object({
    sub: z.string().min(1),
    iss: z.string(),
    typ: z.enum(['ID', 'Bearer']),
    azp: z.string().optional(),
    aud: z.union([z.string(), z.array(z.string())]).optional(),
    email: z.string().min(1).optional(),
    email_verified: z.boolean().optional(),
    phone_number: z.string().min(1).optional(),
    phone_number_verified: z.boolean().optional(),
    name: z.string().optional(),
    picture: z.string().optional(),
});

const jwksByIssuer = new Map<string, JWTVerifyGetKey>();
let resolverForTests: ((issuer: string) => JWTVerifyGetKey) | undefined;

/** Replace JWKS resolution in isolated tests; resetting also clears memoized resolvers. */
export const setKeycloakJwksResolverForTests = (
    resolver: ((issuer: string) => JWTVerifyGetKey) | undefined
): void => {
    resolverForTests = resolver;
    jwksByIssuer.clear();
};

/** Resolve an issuer's JWKS endpoint, optionally using a configured internal hostname. */
export const getKeycloakIssuerJwksUrl = (issuer: string): string => {
    for (const entry of (environment.KEYCLOAK_JWKS_URL_OVERRIDES ?? '').split(',')) {
        const separator = entry.indexOf('=');
        if (separator < 0) continue;
        const configuredIssuer = entry.slice(0, separator).trim();
        const url = entry.slice(separator + 1).trim();
        if (configuredIssuer === issuer && url) return url;
    }
    return `${issuer}/protocol/openid-connect/certs`;
};

/** Reuse remote key caches and rotation handling per trusted issuer. */
export const getKeycloakJwks = (issuer: string): JWTVerifyGetKey => {
    let jwks = jwksByIssuer.get(issuer);
    if (!jwks) {
        jwks = resolverForTests
            ? resolverForTests(issuer)
            : createRemoteJWKSet(new URL(getKeycloakIssuerJwksUrl(issuer)));
        jwksByIssuer.set(issuer, jwks);
    }
    return jwks;
};

/** Verify signature and claims, checking the issuer allowlist before resolving keys. */
export const verifyKeycloakJwt = async (
    token: string,
    opts: KeycloakVerifyOptions
): Promise<KeycloakClaims> => {
    decodeProtectedHeader(token);
    const { iss } = decodeJwt(token);
    if (typeof iss !== 'string' || !opts.issuers.includes(iss)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Keycloak token' });
    }

    const { payload } = await jwtVerify(token, getKeycloakJwks(iss), {
        issuer: iss,
        algorithms: ['RS256', 'ES256'],
        clockTolerance: 30,
    });
    const result = claimsSchema.safeParse(payload);
    if (!result.success) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Keycloak token' });
    }
    const claims = result.data;
    const audiences = typeof claims.aud === 'string' ? [claims.aud] : (claims.aud ?? []);
    if (claims.azp) audiences.push(claims.azp);
    if (!audiences.some(audience => opts.audiences.includes(audience))) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Keycloak token' });
    }
    return claims;
};

/** Read comma-separated issuer and client allowlists from the service configuration. */
export const getKeycloakVerifyOptionsFromEnv = (): KeycloakVerifyOptions | null => {
    const split = (value: string | undefined): string[] =>
        (value ?? '')
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean);
    const issuers = split(environment.KEYCLOAK_ISSUERS);
    return issuers.length ? { issuers, audiences: split(environment.KEYCLOAK_AUDIENCES) } : null;
};
