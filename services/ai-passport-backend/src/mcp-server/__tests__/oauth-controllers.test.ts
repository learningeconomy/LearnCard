import { afterEach, describe, test, expect, beforeEach, spyOn, mock } from 'bun:test';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
mock.module('../../ai/privacy-keys', () => ({
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
    getPrivacySubjectRef: (did: string) => crypto.createHash('sha256').update(did).digest('hex'),
}));
// Load after installing the isolated privacy-key fixture.
const { handleAuthorize, handleCallback, handleTokenExchange } =
    await import('../oauth/backend-controllers');
const { registerClient } = await import('../oauth/clients');
const { getRefreshToken, storeRefreshToken, generateAuthorizationCode } =
    await import('../oauth/storage');
const { JWT_SECRET } = await import('../../constants/env');
const { default: cache } = await import('../../utils/cache');
const { withOwnerOperation, requestDataErasure } = await import('../../services/dataErasure');
await cache.redis?.quit();
afterEach(async () => {
    const store = cache.redis!;
    const prefix = store.options.keyPrefix;
    if (!prefix) throw new Error('Isolated Redis fixture prefix is required');
    const keys = await store.keys(`${prefix}*`);
    if (keys.length) await store.del(...keys.map(key => key.slice(prefix.length)));
    await store.quit();
});

// ============================================================================
// Test Constants
// ============================================================================

const TEST_CLIENT_ID = 'test-client';
const TEST_REDIRECT_URI = 'http://localhost:3000/callback';
const TEST_USER_DID = 'did:example:user';

const oauthDidAuth = new Map<string, { binding: string; challenge: string; returnTo: string }>();
const testDidAuth = {
    async createChallenge(input: { audience: string; returnTo: string }) {
        const binding = crypto.randomBytes(32).toString('base64url');
        const challenge = crypto.randomBytes(32).toString('base64url');
        const sessionId = input.returnTo.replace('oauth:', '');

        oauthDidAuth.set(sessionId, {
            binding,
            challenge,
            returnTo: input.returnTo,
        });

        return { binding, challenge, expiresAt: Date.now() + 300_000 };
    },
    async authenticate(input: {
        challenge: string;
        expectedBinding?: string;
        expectedReturnTo?: string;
        presentation: string;
    }) {
        const sessionId = input.expectedReturnTo?.replace('oauth:', '') ?? '';
        const expected = oauthDidAuth.get(sessionId);

        if (
            !expected ||
            expected.binding !== input.expectedBinding ||
            expected.challenge !== input.challenge ||
            expected.returnTo !== input.expectedReturnTo ||
            !input.presentation.startsWith('vp:')
        ) {
            throw new Error('Invalid DID Auth');
        }

        oauthDidAuth.delete(sessionId);

        return {
            did: input.presentation.slice(3),
            returnTo: expected.returnTo,
            sessionId: `auth:${sessionId}`,
        };
    },
    async deleteSession() {},
};

// ============================================================================
// Test Helpers - Abstract away implementation details
// ============================================================================

/** Generate a valid PKCE challenge/verifier pair */
function generatePKCE() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
}

/** Clean slate for each test */
async function clearAllOAuthData() {
    cache.redis = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: `oauth-controller-test:${crypto.randomUUID()}:`,
    });
    oauthDidAuth.clear();
}

/** Register a test client with given redirect URIs */
async function registerTestClient(clientId: string, redirectUris: string[], clientName?: string) {
    return registerClient({
        client_id: clientId,
        client_name: clientName ?? `Test ${clientId}`,
        redirect_uris: redirectUris,
    });
}

/** Start OAuth flow and return session ID */
async function startOAuthFlow(params: {
    clientId: string;
    redirectUri: string;
    challenge: string;
    state?: string;
}) {
    const result = await handleAuthorize(
        {
            client_id: params.clientId,
            redirect_uri: params.redirectUri,
            state: params.state ?? 'test-state',
            code_challenge: params.challenge,
            code_challenge_method: 'S256',
            response_type: 'code',
        },
        testDidAuth
    );

    if (!result.success) {
        return { success: false as const, error: result.error };
    }

    const url = new URL(result.data.redirectUrl);
    const returnTo = url.searchParams.get('returnTo')!;
    const sessionId = new URL(returnTo).searchParams.get('session')!;

    return {
        success: true as const,
        sessionId,
        redirectUrl: result.data.redirectUrl,
    };
}

/** Simulate user authenticating via LearnCard */
async function authenticateUser(sessionId: string | null, did: string) {
    const didAuth = sessionId ? oauthDidAuth.get(sessionId) : undefined;
    const result = await handleCallback(
        `vp:${did}`,
        didAuth?.challenge ?? null,
        didAuth?.binding ?? null,
        sessionId,
        testDidAuth
    );

    if (!result.success) {
        return { success: false as const, error: result.error };
    }

    const url = new URL(result.data.redirectUrl);
    const authCode = url.searchParams.get('code')!;
    const state = url.searchParams.get('state');

    return {
        success: true as const,
        authCode,
        state,
        redirectUrl: result.data.redirectUrl,
    };
}

/** Exchange authorization code for access token */
async function exchangeCodeForToken(params: {
    code: string | null;
    verifier: string;
    clientId: string;
    redirectUri: string;
}) {
    return handleTokenExchange({
        grant_type: 'authorization_code',
        code: params.code,
        code_verifier: params.verifier,
        client_id: params.clientId,
        redirect_uri: params.redirectUri,
        refresh_token: null,
    });
}

/** Complete the entire OAuth flow and return access token */
async function completeOAuthFlow(params: {
    clientId: string;
    redirectUri: string;
    userDid: string;
    state?: string;
}) {
    const { verifier, challenge } = generatePKCE();

    const authStart = await startOAuthFlow({
        clientId: params.clientId,
        redirectUri: params.redirectUri,
        challenge,
        state: params.state,
    });
    if (!authStart.success) throw new Error(`Auth start failed: ${authStart.error}`);

    const auth = await authenticateUser(authStart.sessionId, params.userDid);
    if (!auth.success) throw new Error(`Authentication failed: ${auth.error}`);

    const token = await exchangeCodeForToken({
        code: auth.authCode,
        verifier,
        clientId: params.clientId,
        redirectUri: params.redirectUri,
    });
    if (!token.success) throw new Error(`Token exchange failed: ${token.error}`);

    return token.data;
}

// ============================================================================
// Tests - Organized by API endpoint / user journey
// ============================================================================

describe('OAuth API', () => {
    beforeEach(async () => {
        await clearAllOAuthData();
    });

    // ==========================================================================
    // POST /oauth/register - Client Registration
    // ==========================================================================
    describe('Client Registration (POST /oauth/register)', () => {
        test('clients can register with redirect URIs', async () => {
            const clientId = 'my-app';
            const redirectUri = 'https://my-app.com/callback';

            await registerTestClient(clientId, [redirectUri]);

            // Verify client can now start OAuth flow
            const { challenge } = generatePKCE();
            const result = await startOAuthFlow({
                clientId,
                redirectUri,
                challenge,
            });

            expect(result.success).toBe(true);
        });

        test('clients can register multiple redirect URIs', async () => {
            const clientId = 'multi-env-app';
            const redirectUris = [
                'http://localhost:3000/callback',
                'https://staging.app.com/callback',
                'https://app.com/callback',
            ];

            await registerTestClient(clientId, redirectUris);

            const { challenge } = generatePKCE();

            // All registered URIs should work
            for (const redirectUri of redirectUris) {
                const result = await startOAuthFlow({
                    clientId,
                    redirectUri,
                    challenge,
                });
                expect(result.success).toBe(true);
            }
        });
    });

    // ==========================================================================
    // GET /oauth/authorize - Authorization Request
    // ==========================================================================
    describe('Authorization Request (GET /oauth/authorize)', () => {
        beforeEach(async () => {
            await registerTestClient(TEST_CLIENT_ID, [
                TEST_REDIRECT_URI,
                'https://app.example.com/callback',
            ]);
        });

        test('redirects user to LearnCard for authentication', async () => {
            const { challenge } = generatePKCE();

            const result = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.redirectUrl).toContain('consent-flow-login');
            }
        });

        test('includes session in the LearnCard redirect for callback', async () => {
            const { challenge } = generatePKCE();

            const result = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.redirectUrl).toContain('session%3D');
            }
        });

        test('rejects unregistered clients', async () => {
            const { challenge } = generatePKCE();

            const result = await handleAuthorize({
                client_id: 'unknown-client',
                redirect_uri: 'http://attacker.com/steal',
                state: 'state',
                code_challenge: challenge,
                code_challenge_method: 'S256',
                response_type: 'code',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('invalid_client');
                expect(result.statusCode).toBe(401);
            }
        });

        test('rejects redirect URIs not registered for the client', async () => {
            const { challenge } = generatePKCE();

            const result = await handleAuthorize({
                client_id: TEST_CLIENT_ID,
                redirect_uri: 'http://attacker.com/steal',
                state: 'state',
                code_challenge: challenge,
                code_challenge_method: 'S256',
                response_type: 'code',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('invalid_redirect_uri');
                expect(result.statusCode).toBe(400);
            }
        });

        test('requires PKCE code_challenge', async () => {
            const result = await handleAuthorize({
                client_id: TEST_CLIENT_ID,
                redirect_uri: TEST_REDIRECT_URI,
                state: 'state',
                code_challenge: null,
                code_challenge_method: 'S256',
                response_type: 'code',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.statusCode).toBe(400);
            }
        });

        test("only accepts 'code' response_type (PKCE flow)", async () => {
            const { challenge } = generatePKCE();

            const result = await handleAuthorize({
                client_id: TEST_CLIENT_ID,
                redirect_uri: TEST_REDIRECT_URI,
                state: 'state',
                code_challenge: challenge,
                code_challenge_method: 'S256',
                response_type: 'token', // Implicit flow - not supported
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Invalid OAuth parameters');
            }
        });
    });

    // ==========================================================================
    // GET /oauth/callback - User Authentication Callback
    // ==========================================================================
    describe('User Authentication Callback (GET /oauth/callback)', () => {
        beforeEach(async () => {
            await registerTestClient(TEST_CLIENT_ID, [TEST_REDIRECT_URI]);
        });

        test('returns authorization code after user authenticates', async () => {
            const { challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);

            expect(auth.success).toBe(true);
            if (auth.success) {
                expect(auth.authCode).toBeTruthy();
                expect(auth.redirectUrl).toContain(TEST_REDIRECT_URI);
            }
        });

        test('preserves state parameter for CSRF protection', async () => {
            const { challenge } = generatePKCE();
            const state = 'my-csrf-token';

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
                state,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);

            expect(auth.success).toBe(true);
            if (auth.success) {
                expect(auth.state).toBe(state);
            }
        });

        test('rejects invalid or expired sessions', async () => {
            const result = await authenticateUser('non-existent-session', TEST_USER_DID);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Invalid callback parameters');
            }
        });

        test('rejects missing user DID', async () => {
            const { challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const result = await handleCallback(null, null, null, authStart.sessionId, testDidAuth);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Invalid callback parameters');
            }
        });

        test('authorization codes are single-use (replay protection)', async () => {
            const { challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            // First callback succeeds
            const first = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(first.success).toBe(true);

            // Second callback fails - session is consumed
            const second = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(second.success).toBe(false);
        });
    });

    // ==========================================================================
    // POST /oauth/token - Token Exchange
    // ==========================================================================
    describe('Token Exchange (POST /oauth/token)', () => {
        beforeEach(async () => {
            await registerTestClient(TEST_CLIENT_ID, [TEST_REDIRECT_URI]);
        });

        test('exchanges valid authorization code for JWT access token', async () => {
            const { verifier, challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(token.success).toBe(true);
            if (token.success) {
                expect(token.data.access_token).toBeTruthy();
                expect(token.data.token_type).toBe('Bearer');
                expect(token.data.expires_in).toBe(3600);
            }
        });

        test('concurrent refreshes cannot both redeem the same predecessor', async () => {
            const oldToken = 'refresh-before-race';
            await storeRefreshToken(oldToken, TEST_USER_DID, TEST_CLIENT_ID);
            const request = {
                grant_type: 'refresh_token',
                refresh_token: oldToken,
                client_id: TEST_CLIENT_ID,
                code: null,
                code_verifier: null,
                redirect_uri: null,
            };
            const results = await Promise.all([
                handleTokenExchange(request),
                handleTokenExchange(request),
            ]);
            expect(results.filter(result => result.success)).toHaveLength(1);
            expect(await getRefreshToken(oldToken)).toEqual({
                success: false,
                error: 'not_found',
            });
            const winner = results.find(result => result.success);
            if (!winner?.success) throw new Error('Missing winning rotation');
            expect(await getRefreshToken(winner.data.refresh_token!)).toMatchObject({
                success: true,
                data: { did: TEST_USER_DID },
            });
        });

        test('erasure between refresh validation and atomic rotation publishes no successor', async () => {
            const oldToken = 'refresh-before-erasure';
            await storeRefreshToken(oldToken, TEST_USER_DID, TEST_CLIENT_ID);
            const started = Promise.withResolvers<void>();
            const resume = Promise.withResolvers<void>();
            const store = cache.redis!;
            const original = store.eval.bind(store);
            const intercepted = spyOn(store, 'eval').mockImplementation(
                async (script, keyCount, ...args) => {
                    if (args[3] === `oauth:refresh:${oldToken}`) {
                        started.resolve();
                        await resume.promise;
                    }
                    return Reflect.apply(original, store, [script, keyCount, ...args]);
                }
            );
            try {
                const rotation = handleTokenExchange({
                    grant_type: 'refresh_token',
                    refresh_token: oldToken,
                    client_id: TEST_CLIENT_ID,
                    code: null,
                    code_verifier: null,
                    redirect_uri: null,
                });
                await started.promise;
                await requestDataErasure(TEST_USER_DID);
                resume.resolve();
                expect(await rotation).toEqual({
                    success: false,
                    error: 'server_error',
                    statusCode: 500,
                });
                expect(
                    (await store.keys(`${store.options.keyPrefix}oauth:refresh:*`)).map(key =>
                        key.slice(store.options.keyPrefix!.length)
                    )
                ).toEqual([`oauth:refresh:${oldToken}`]);
            } finally {
                resume.resolve();
                intercepted.mockRestore();
            }
        });

        test("JWT contains the authenticated user's DID", async () => {
            const { verifier, challenge } = generatePKCE();
            const userDid = 'did:example:alice';

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, userDid);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(token.success).toBe(true);
            if (token.success) {
                const decoded = jwt.decode(token.data.access_token) as { sub: string };
                expect(decoded.sub).toBe(userDid);
            }
        });

        test('JWT contains the client ID (aud claim)', async () => {
            const { verifier, challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(token.success).toBe(true);
            if (token.success) {
                const decoded = jwt.decode(token.data.access_token) as { aud: string };
                expect(decoded.aud).toBe(TEST_CLIENT_ID);
            }
        });

        test('rejects incorrect PKCE verifier', async () => {
            const { challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier: 'wrong-verifier-does-not-match',
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(token.success).toBe(false);
            if (!token.success) {
                expect(token.error).toBe('invalid_grant');
            }
        });

        test('rejects mismatched client_id', async () => {
            const { verifier, challenge } = generatePKCE();
            const otherClientId = 'other-client';
            await registerTestClient(otherClientId, [TEST_REDIRECT_URI]);

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId: otherClientId, // Different client
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(token.success).toBe(false);
            if (!token.success) {
                expect(token.error).toBe('invalid_grant');
            }
        });

        test('rejects mismatched redirect_uri', async () => {
            const { verifier, challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId: TEST_CLIENT_ID,
                redirectUri: 'http://attacker.com/callback', // Different redirect
            });

            expect(token.success).toBe(false);
            if (!token.success) {
                expect(token.error).toBe('invalid_grant');
            }
        });

        test('concurrent authorization-code exchanges issue one token', async () => {
            const { verifier, challenge } = generatePKCE();

            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            const exchange = () =>
                exchangeCodeForToken({
                    code: auth.authCode,
                    verifier,
                    clientId: TEST_CLIENT_ID,
                    redirectUri: TEST_REDIRECT_URI,
                });
            const results = await Promise.all([exchange(), exchange()]);

            expect(results.filter(result => result.success)).toHaveLength(1);
            expect(results.filter(result => !result.success)).toHaveLength(1);

            const replay = await exchange();
            expect(replay.success).toBe(false);
            if (!replay.success) expect(replay.error).toBe('invalid_grant');
        });

        test('rejects authorization codes redeemed by the previous version', async () => {
            const { verifier, challenge } = generatePKCE();
            const authStart = await startOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                challenge,
            });
            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            const auth = await authenticateUser(authStart.sessionId, TEST_USER_DID);
            expect(auth.success).toBe(true);
            if (!auth.success) return;

            // The previous version retained redeemed codes for 30 seconds.
            const key = `oauth:authcode:${auth.authCode}`;
            const data = JSON.parse((await cache.get(key))!);
            await withOwnerOperation(TEST_USER_DID, () =>
                cache.set(key, JSON.stringify({ ...data, used: true }), 30)
            );

            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(token).toEqual({
                success: false,
                error: 'invalid_grant',
                statusCode: 400,
            });
        });

        test.each(['oauth:authcode:', 'oauth:refresh:'] as const)(
            'returns no tokens when authorization exchange storage %s fails',
            async method => {
                const { verifier, challenge } = generatePKCE();
                const code = await generateAuthorizationCode(
                    TEST_USER_DID,
                    TEST_CLIENT_ID,
                    TEST_REDIRECT_URI,
                    challenge,
                    'S256'
                );
                const store = cache.redis!;
                const original = store.eval.bind(store);
                const failure = spyOn(store, 'eval').mockImplementation(
                    async (script, keyCount, ...args) => {
                        if (String(args[3]).startsWith(method))
                            throw new Error('Storage unavailable');
                        return Reflect.apply(original, store, [script, keyCount, ...args]);
                    }
                );
                try {
                    expect(
                        await exchangeCodeForToken({
                            code,
                            verifier,
                            clientId: TEST_CLIENT_ID,
                            redirectUri: TEST_REDIRECT_URI,
                        })
                    ).toEqual({ success: false, error: 'server_error', statusCode: 500 });
                } finally {
                    failure.mockRestore();
                }
            }
        );

        test('preserves the existing refresh grant when replacement storage fails', async () => {
            const tokens = await completeOAuthFlow({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                userDid: TEST_USER_DID,
            });
            const refresh = () =>
                handleTokenExchange({
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refresh_token ?? null,
                    client_id: TEST_CLIENT_ID,
                    code: null,
                    code_verifier: null,
                    redirect_uri: null,
                });
            const store = cache.redis!;
            const original = store.eval.bind(store);
            const failure = spyOn(store, 'eval').mockImplementation(
                async (script, keyCount, ...args) => {
                    if (String(args[3]).startsWith('oauth:refresh:'))
                        throw new Error('Storage unavailable');
                    return Reflect.apply(original, store, [script, keyCount, ...args]);
                }
            );
            try {
                expect(await refresh()).toEqual({
                    success: false,
                    error: 'server_error',
                    statusCode: 500,
                });
            } finally {
                failure.mockRestore();
            }
            const recovered = await refresh();
            expect(recovered.success).toBe(true);
            if (recovered.success) {
                expect(jwt.verify(recovered.data.access_token, JWT_SECRET)).toMatchObject({
                    sub: TEST_USER_DID,
                });
            }
        });

        test('rejects unsupported grant types', async () => {
            const result = await handleTokenExchange({
                grant_type: 'client_credentials',
                code: 'any',
                code_verifier: 'any',
                client_id: TEST_CLIENT_ID,
                redirect_uri: TEST_REDIRECT_URI,
                refresh_token: null,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('unsupported_grant_type');
            }
        });

        test('rejects non-existent authorization codes', async () => {
            const result = await exchangeCodeForToken({
                code: 'invalid-code-that-does-not-exist',
                verifier: 'any-verifier',
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('invalid_grant');
            }
        });
    });

    // ==========================================================================
    // Access Token Security
    // ==========================================================================
    describe('Access Token Security', () => {
        const SECURE_CLIENT_ID = 'secure-client';

        beforeEach(async () => {
            await registerTestClient(SECURE_CLIENT_ID, [TEST_REDIRECT_URI]);
        });

        test('tokens can be verified with the server secret', async () => {
            const userDid = 'did:example:verified-user';
            const tokenData = await completeOAuthFlow({
                clientId: SECURE_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                userDid,
            });

            const decoded = jwt.verify(tokenData.access_token, JWT_SECRET) as {
                sub: string;
            };
            expect(decoded.sub).toBe(userDid);
        });

        test('tokens cannot be verified with wrong secret', async () => {
            const tokenData = await completeOAuthFlow({
                clientId: SECURE_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                userDid: TEST_USER_DID,
            });

            expect(() => {
                jwt.verify(tokenData.access_token, 'wrong-secret');
            }).toThrow();
        });

        test('tampered tokens fail verification', async () => {
            const tokenData = await completeOAuthFlow({
                clientId: SECURE_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                userDid: TEST_USER_DID,
            });

            const tampered = tokenData.access_token.slice(0, -5) + 'XXXXX';

            expect(() => {
                jwt.verify(tampered, JWT_SECRET);
            }).toThrow();
        });

        test('tokens expire after 60 minutes', async () => {
            const tokenData = await completeOAuthFlow({
                clientId: SECURE_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                userDid: TEST_USER_DID,
            });

            const decoded = jwt.verify(tokenData.access_token, JWT_SECRET) as {
                exp: number;
            };
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = decoded.exp - now;

            expect(expiresIn).toBeGreaterThan(3590);
            expect(expiresIn).toBeLessThanOrEqual(3600);
        });

        test('expired tokens are rejected', async () => {
            const now = Math.floor(Date.now() / 1000);
            const expiredToken = jwt.sign(
                {
                    sub: TEST_USER_DID,
                    aud: SECURE_CLIENT_ID,
                    iss: 'http://localhost:3001',
                    iat: now - 120, // Issued 2 minutes ago
                    exp: now - 60, // Expired 1 minute ago
                },
                JWT_SECRET,
                { algorithm: 'HS256' }
            );

            expect(() => {
                jwt.verify(expiredToken, JWT_SECRET);
            }).toThrow('jwt expired');
        });
    });

    // ==========================================================================
    // Complete OAuth Flow - End-to-End
    // ==========================================================================
    describe('Complete OAuth Flow', () => {
        test('client application can authenticate users via OAuth + PKCE', async () => {
            const clientId = 'my-spa';
            const redirectUri = 'https://my-spa.example.com/callback';
            const userDid = 'did:web:alice.example';
            const state = 'client-csrf-protection';

            // Setup: Client registers their application
            await registerTestClient(clientId, [redirectUri]);

            // Step 1: Client initiates OAuth flow
            const { verifier, challenge } = generatePKCE();
            const authStart = await startOAuthFlow({
                clientId,
                redirectUri,
                challenge,
                state,
            });

            expect(authStart.success).toBe(true);
            if (!authStart.success) return;

            // Step 2: User authenticates with LearnCard (simulated by callback)
            const auth = await authenticateUser(authStart.sessionId, userDid);

            expect(auth.success).toBe(true);
            if (!auth.success) return;
            expect(auth.state).toBe(state);

            // Step 3: Client exchanges code for token
            const token = await exchangeCodeForToken({
                code: auth.authCode,
                verifier,
                clientId,
                redirectUri,
            });

            expect(token.success).toBe(true);
            if (!token.success) return;

            // Step 4: Client can now use the token to identify the user
            const decoded = jwt.verify(token.data.access_token, JWT_SECRET) as {
                sub: string;
            };
            expect(decoded.sub).toBe(userDid);
        });

        test('mobile app with custom scheme can authenticate users', async () => {
            const clientId = 'my-mobile-app';
            const redirectUri = 'myapp://oauth/callback';
            const userDid = 'did:example:mobile-user';

            await registerTestClient(clientId, [redirectUri]);

            const tokenData = await completeOAuthFlow({
                clientId,
                redirectUri,
                userDid,
            });

            const decoded = jwt.decode(tokenData.access_token) as { sub: string };
            expect(decoded.sub).toBe(userDid);
        });

        test('local development environment works', async () => {
            const clientId = 'dev-app';
            const redirectUri = 'http://localhost:5173/auth/callback';

            await registerTestClient(clientId, [redirectUri]);

            const tokenData = await completeOAuthFlow({
                clientId,
                redirectUri,
                userDid: 'did:example:dev-user',
            });

            expect(tokenData.access_token).toBeTruthy();
        });
    });
});
