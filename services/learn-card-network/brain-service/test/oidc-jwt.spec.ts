import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignJWT, generateKeyPair, importJWK, exportJWK, type KeyLike } from 'jose';

// Mock jose's createRemoteJWKSet to return a local key resolver
// instead of hitting real OIDC endpoints. jwtVerify remains real.
let rsaPublicKey: KeyLike;
let rsaPrivateKey: KeyLike;

vi.mock('jose', async () => {
    const actual = await vi.importActual<typeof import('jose')>('jose');
    return {
        ...actual,
        createRemoteJWKSet: () => {
            // Return a function that resolves to the test public key
            return async () => rsaPublicKey;
        },
    };
});

const TEST_ISSUER = 'https://securetoken.google.com/test-project';
const TEST_AUDIENCE = 'test-project';

async function createSignedJwt(
    claims: Record<string, unknown>,
    options?: { expiresIn?: string; privateKey?: KeyLike }
) {
    const key = options?.privateKey ?? rsaPrivateKey;
    return new SignJWT(claims as any)
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
        .setIssuedAt()
        .setExpirationTime(options?.expiresIn ?? '1h')
        .sign(key);
}

describe('verifyAuthToken', () => {
    const originalEnv = { ...process.env };

    beforeEach(async () => {
        const pair = await generateKeyPair('RS256');
        rsaPublicKey = pair.publicKey;
        rsaPrivateKey = pair.privateKey;

        process.env.OIDC_TRUSTED_ISSUERS = TEST_ISSUER;
        process.env.OIDC_EXPECTED_AUDIENCE = TEST_AUDIENCE;

        // Mock fetch for OIDC discovery (getJWKS still calls it for the discovery doc)
        vi.stubGlobal(
            'fetch',
            vi.fn(async () =>
                new Response(
                    JSON.stringify({
                        issuer: TEST_ISSUER,
                        jwks_uri: `${TEST_ISSUER}/jwks`,
                    }),
                    { status: 200, headers: { 'content-type': 'application/json' } }
                )
            )
        );
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
        vi.resetModules();
    });

    async function loadVerifyAuthToken() {
        const mod = await import('../src/helpers/oidc-jwt.helpers');
        return mod.verifyAuthToken;
    }

    it('should verify a valid JWT and extract email claims', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: TEST_ISSUER,
            aud: TEST_AUDIENCE,
            sub: 'user-123',
            email: 'alice@example.com',
            email_verified: true,
        });

        const result = await verifyAuthToken(token);

        expect(result).not.toBeNull();
        expect(result!.email).toBe('alice@example.com');
        expect(result!.emailVerified).toBe(true);
        expect(result!.uid).toBe('user-123');
        expect(result!.provider).toBe(TEST_ISSUER);
    });

    it('should return null when no providers are configured', async () => {
        process.env.OIDC_TRUSTED_ISSUERS = '';
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: TEST_ISSUER,
            aud: TEST_AUDIENCE,
            sub: 'user-123',
            email: 'alice@example.com',
            email_verified: true,
        });

        const result = await verifyAuthToken(token);
        expect(result).toBeNull();
    });

    it('should return null for an unknown issuer', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: 'https://unknown-provider.com',
            aud: TEST_AUDIENCE,
            sub: 'user-123',
            email: 'alice@example.com',
            email_verified: true,
        });

        const result = await verifyAuthToken(token);
        expect(result).toBeNull();
    });

    it('should return null for a malformed token', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const result = await verifyAuthToken('not-a-jwt');
        expect(result).toBeNull();
    });

    it('should return null for a completely empty token', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const result = await verifyAuthToken('');
        expect(result).toBeNull();
    });

    it('should return null for a token signed with the wrong key', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const wrongPair = await generateKeyPair('RS256');
        const token = await createSignedJwt(
            {
                iss: TEST_ISSUER,
                aud: TEST_AUDIENCE,
                sub: 'user-123',
                email: 'alice@example.com',
                email_verified: true,
            },
            { privateKey: wrongPair.privateKey }
        );

        const result = await verifyAuthToken(token);
        expect(result).toBeNull();
    });

    it('should return null for an expired token', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await new SignJWT({
            iss: TEST_ISSUER,
            aud: TEST_AUDIENCE,
            sub: 'user-123',
            email: 'alice@example.com',
            email_verified: true,
        } as any)
            .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
            .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
            .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
            .sign(rsaPrivateKey);

        const result = await verifyAuthToken(token);
        expect(result).toBeNull();
    });

    it('should return null for a token with wrong audience', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: TEST_ISSUER,
            aud: 'wrong-audience',
            sub: 'user-123',
            email: 'alice@example.com',
            email_verified: true,
        });

        const result = await verifyAuthToken(token);
        expect(result).toBeNull();
    });

    it('should handle emailVerified = false', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: TEST_ISSUER,
            aud: TEST_AUDIENCE,
            sub: 'user-123',
            email: 'alice@example.com',
            email_verified: false,
        });

        const result = await verifyAuthToken(token);
        expect(result).not.toBeNull();
        expect(result!.email).toBe('alice@example.com');
        expect(result!.emailVerified).toBe(false);
    });

    it('should support multiple configured issuers', async () => {
        const secondIssuer = 'https://keycloak.example.com/realms/test';
        process.env.OIDC_TRUSTED_ISSUERS = `${TEST_ISSUER}, ${secondIssuer}`;

        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: secondIssuer,
            aud: TEST_AUDIENCE,
            sub: 'user-456',
            email: 'bob@example.com',
            email_verified: true,
        });

        const result = await verifyAuthToken(token);
        expect(result).not.toBeNull();
        expect(result!.email).toBe('bob@example.com');
        expect(result!.provider).toBe(secondIssuer);
    });

    it('should handle missing email claim gracefully', async () => {
        const verifyAuthToken = await loadVerifyAuthToken();

        const token = await createSignedJwt({
            iss: TEST_ISSUER,
            aud: TEST_AUDIENCE,
            sub: 'user-123',
            // no email claim
        });

        const result = await verifyAuthToken(token);
        expect(result).not.toBeNull();
        expect(result!.email).toBe('');
        expect(result!.emailVerified).toBe(false);
    });
});
