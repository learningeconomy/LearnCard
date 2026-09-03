import { environment } from '@environment';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

type AuthProviderConfig = {
    issuer: string;
    audience: string;
    emailClaim?: string;
    emailVerifiedClaim?: string;
};

// Module-level JWKS cache keyed by issuer
const jwksCache = new Map<string, JWTVerifyGetKey>();

const oidcDiscoverySchema = z.object({ jwks_uri: z.url() });

async function getJWKS(issuer: string): Promise<JWTVerifyGetKey> {
    if (jwksCache.has(issuer)) return jwksCache.get(issuer)!;

    const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const res = await fetch(discoveryUrl);
    const config = oidcDiscoverySchema.parse(await res.json());

    const jwks = createRemoteJWKSet(new URL(config.jwks_uri));
    jwksCache.set(issuer, jwks);

    return jwks;
}

function getAuthProviders(): AuthProviderConfig[] {
    const issuers = (environment.OIDC_TRUSTED_ISSUERS ?? '').split(',').filter(Boolean);
    const audience = environment.OIDC_EXPECTED_AUDIENCE ?? '';
    return issuers.map(issuer => ({ issuer: issuer.trim(), audience }));
}

export async function verifyAuthToken(
    token: string
): Promise<{ email: string; emailVerified: boolean; uid: string; provider: string } | null> {
    try {
        const providers = getAuthProviders();
        if (providers.length === 0) return null;

        // Decode payload to find issuer (without verification)
        const [, payloadB64] = token.split('.');
        if (!payloadB64) return null;

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

        const provider = providers.find(
            p => payload.iss === p.issuer || payload.iss?.startsWith(p.issuer)
        );
        if (!provider) return null;

        // Verify with provider's JWKS
        const jwks = await getJWKS(provider.issuer);
        const { payload: verified } = await jwtVerify(token, jwks, {
            issuer: provider.issuer,
            audience: provider.audience,
        });

        const email = (verified[provider.emailClaim ?? 'email'] as string) ?? '';
        const emailVerified =
            (verified[provider.emailVerifiedClaim ?? 'email_verified'] as boolean) ?? false;

        return {
            email,
            emailVerified,
            uid: verified.sub as string,
            provider: provider.issuer,
        };
    } catch (e) {
        console.error('OIDC JWT verification failed:', e);
        return null;
    }
}
