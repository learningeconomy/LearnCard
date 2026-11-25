import { afterEach, describe, test, expect, beforeEach, mock } from 'bun:test';
import crypto from 'crypto';
import Redis from 'ioredis';
mock.module('../../ai/privacy-keys', () => ({
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
    getPrivacySubjectRef: (did: string) => crypto.createHash('sha256').update(did).digest('hex'),
}));
// Load after installing the isolated privacy-key fixture.
const { verifyPKCE } = await import('../oauth/pkce');
const { consumeAuthorizationCode, generateAuthorizationCode } = await import('../oauth/storage');
const { createOAuthSession, consumeOAuthSession } = await import('../oauth/sessions');
const { default: cache } = await import('../../utils/cache');
const { withOwnerOperation } = await import('../../services/dataErasure');
await cache.redis?.quit();
let redis: Redis;
afterEach(async () => {
    const prefix = redis.options.keyPrefix!;
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys.map(key => key.slice(prefix.length)));
    await redis.quit();
});

// ============================================================
// Test Constants
// ============================================================

const TEST_CLIENT_ID = 'test-client';
const TEST_REDIRECT_URI = 'http://localhost/callback';
const TEST_USER_DID = 'did:test:user';
const PKCE_METHOD_S256 = 'S256';

// ============================================================
// Test Helpers
// ============================================================

function generatePKCEPair() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
}

async function clearOAuthCache() {
    redis = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: `oauth-test:${crypto.randomUUID()}:`,
    });
    cache.redis = redis;
}

// ============================================================
// Tests
// ============================================================

describe('OAuth Internal Modules', () => {
    beforeEach(async () => {
        await clearOAuthCache();
    });

    // ----------------------------------------------------------
    // PKCE - Proves the token requester is the same as flow initiator
    // ----------------------------------------------------------
    describe('PKCE Verification', () => {
        test('accepts matching verifier for S256 challenge', () => {
            const { verifier, challenge } = generatePKCEPair();

            expect(verifyPKCE(verifier, challenge, PKCE_METHOD_S256)).toBe(true);
        });

        test('rejects wrong verifier', () => {
            const { challenge } = generatePKCEPair();

            expect(verifyPKCE('wrong-verifier', challenge, PKCE_METHOD_S256)).toBe(false);
        });

        test('rejects unsupported challenge methods', () => {
            const { verifier, challenge } = generatePKCEPair();

            expect(verifyPKCE(verifier, challenge, 'unknown')).toBe(false);
        });
    });

    // ----------------------------------------------------------
    // Authorization Codes - Store auth data for token exchange
    // ----------------------------------------------------------
    describe('Authorization Codes', () => {
        test('atomically consumes stored authorization data', async () => {
            const { challenge } = generatePKCEPair();

            const code = await generateAuthorizationCode(
                TEST_USER_DID,
                TEST_CLIENT_ID,
                TEST_REDIRECT_URI,
                challenge,
                PKCE_METHOD_S256
            );
            const [first, second] = await Promise.all([
                consumeAuthorizationCode(code),
                consumeAuthorizationCode(code),
            ]);

            const successful = [first, second].filter(result => result.success);
            expect(successful).toHaveLength(1);

            const result = successful[0];
            if (result.success) {
                expect(result.data.did).toBe(TEST_USER_DID);
                expect(result.data.clientId).toBe(TEST_CLIENT_ID);
                expect(result.data.redirectUri).toBe(TEST_REDIRECT_URI);
                expect(result.data.codeChallenge).toBe(challenge);
            }
        });

        test('rejects unknown codes', async () => {
            const result = await consumeAuthorizationCode('non-existent-code');

            expect(result.success).toBe(false);
        });
    });

    // ----------------------------------------------------------
    // Sessions - Temporary storage during user authentication
    // ----------------------------------------------------------
    describe('OAuth Sessions', () => {
        test("consumes session data under the authenticated owner's fence", async () => {
            const { challenge } = generatePKCEPair();
            const state = 'csrf-token';

            const sessionId = await createOAuthSession({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                state,
                codeChallenge: challenge,
                codeChallengeMethod: PKCE_METHOD_S256,
            });
            const result = await withOwnerOperation(TEST_USER_DID, () =>
                consumeOAuthSession(sessionId)
            );

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.clientId).toBe(TEST_CLIENT_ID);
                expect(result.data.redirectUri).toBe(TEST_REDIRECT_URI);
                expect(result.data.state).toBe(state);
                expect(result.data.codeChallenge).toBe(challenge);
            }
        });

        test('rejects unknown session IDs', async () => {
            const result = await consumeOAuthSession('non-existent-session');

            expect(result.success).toBe(false);
        });

        test('only one concurrent consumer can redeem a session', async () => {
            const { challenge } = generatePKCEPair();

            const sessionId = await createOAuthSession({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                state: 'state',
                codeChallenge: challenge,
                codeChallengeMethod: PKCE_METHOD_S256,
            });

            const results = await Promise.all([
                withOwnerOperation(TEST_USER_DID, () => consumeOAuthSession(sessionId)),
                withOwnerOperation(TEST_USER_DID, () => consumeOAuthSession(sessionId)),
            ]);
            expect(results.filter(result => result.success)).toHaveLength(1);
        });
    });

    // ----------------------------------------------------------
    // Integration - Full PKCE flow through internal modules
    // ----------------------------------------------------------
    describe('Complete PKCE Flow', () => {
        test('verifier created at flow start validates against stored challenge', async () => {
            const { verifier, challenge } = generatePKCEPair();

            // Authorization: store challenge in session
            const sessionId = await createOAuthSession({
                clientId: TEST_CLIENT_ID,
                redirectUri: TEST_REDIRECT_URI,
                state: 'csrf-token',
                codeChallenge: challenge,
                codeChallengeMethod: PKCE_METHOD_S256,
            });

            // Callback: consume session before transferring its challenge to an auth code.
            const session = await withOwnerOperation(TEST_USER_DID, () =>
                consumeOAuthSession(sessionId)
            );
            expect(session.success).toBe(true);
            if (!session.success) return;

            const code = await generateAuthorizationCode(
                TEST_USER_DID,
                session.data.clientId,
                session.data.redirectUri,
                session.data.codeChallenge,
                session.data.codeChallengeMethod
            );

            // Token exchange atomically consumes the authorization code.
            const authCode = await consumeAuthorizationCode(code);
            expect(authCode.success).toBe(true);
            if (!authCode.success) return;

            const pkceValid = verifyPKCE(
                verifier,
                authCode.data.codeChallenge,
                authCode.data.codeChallengeMethod
            );
            expect(pkceValid).toBe(true);

            const replay = await consumeAuthorizationCode(code);
            expect(replay.success).toBe(false);
        });
    });
});
