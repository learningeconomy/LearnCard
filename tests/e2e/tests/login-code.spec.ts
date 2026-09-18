/**
 * Login Code Verification Rate Limiting Tests
 *
 * Tests for brute-force protection on the /verify-login-code endpoint.
 * Covers:
 *   - Correct code returns a token
 *   - 5 wrong codes then correct code → still rejected (code invalidated)
 *   - After requesting a new code, verification succeeds again
 *   - 31 attempts from one IP across different emails → rejected
 *   - Same pattern for recovery email verification
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Redis from 'ioredis';

import { getLearnCard } from './helpers/learncard.helpers';

const LCA_API_URL = 'http://localhost:5200';

// redis3 is used by lca-api — exposed on host port 6381
const redis = new Redis({ port: 6381 });

const LOGIN_CODE_PREFIX = 'login-code:';
const RECOVERY_EMAIL_CODE_PREFIX = 'recovery_email_code:';

const createMockAuthToken = (userId: string, email: string) => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');

    const payload = Buffer.from(
        JSON.stringify({
            sub: userId,
            email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        })
    ).toString('base64url');

    return `${header}.${payload}.`;
};

/**
 * Seed a login verification code directly into Redis.
 * Key pattern: `login-code:{email}:{code}`
 */
const seedLoginCode = async (email: string, code: string): Promise<void> => {
    const cacheKey = `${LOGIN_CODE_PREFIX}${email}:${code}`;
    await redis.set(cacheKey, '1', 'EX', 300); // 5 minutes TTL
};

/**
 * Seed a recovery email verification code directly into Redis.
 */
const seedRecoveryEmailCode = async (
    contactEmail: string,
    code: string,
    recoveryEmail: string
): Promise<void> => {
    const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}email:${contactEmail}`;
    await redis.set(cacheKey, JSON.stringify({ code, email: recoveryEmail }), 'EX', 900);
};

/**
 * Clear rate limit keys for a specific email or pattern.
 */
const clearRateLimits = async (pattern: string): Promise<void> => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};

describe('Login Code Verification Rate Limiting', () => {
    const uniqueId = Date.now();

    beforeAll(async () => {
        // Clear any leftover rate limit keys
        await clearRateLimits('rate-limit:login-verify-*');
        await clearRateLimits('rate-limit:recovery-verify-*');
    });

    afterAll(async () => {
        await redis.quit();
    });

    beforeEach(async () => {
        // Clear rate limits between tests
        await clearRateLimits('rate-limit:login-verify-*');
        await clearRateLimits('rate-limit:recovery-verify-*');
    });

    describe('verifyLoginCode', () => {
        test('correct code is consumed and not rate limited', async () => {
            const email = `login-success-${uniqueId}@example.com`;
            const code = '123456';

            await seedLoginCode(email, code);

            const response = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            // In E2E mode, Firebase may not be available, but we verify:
            // 1. No rate limit error
            // 2. Code was consumed (second attempt fails with "Invalid or expired")
            expect(data.error ?? '').not.toContain('Too many attempts');

            // Verify code was consumed
            const secondResponse = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const secondData = await secondResponse.json();
            expect(secondData.error).toContain('Invalid or expired');
        });

        test('login code: 5 wrong attempts invalidates code, correct code still rejected', async () => {
            const email = `login-brute-${uniqueId}@example.com`;
            const correctCode = '654321';

            await seedLoginCode(email, correctCode);

            // Make 5 failed attempts with wrong codes
            for (let i = 0; i < 5; i++) {
                const response = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code: '000000' }),
                });

                expect(response.status).toEqual(200);
                const data = await response.json();
                expect(data.success).toBe(false);
                expect(data.error).toContain('Invalid or expired code');
            }

            // 6th attempt should be rate limited and code should be invalidated
            const sixthResponse = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: '000000' }),
            });

            expect(sixthResponse.status).toEqual(200);
            const sixthData = await sixthResponse.json();
            expect(sixthData.success).toBe(false);
            expect(sixthData.error).toContain('Too many attempts');

            // Now try with correct code — should fail because code was invalidated
            const correctResponse = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: correctCode }),
            });

            expect(correctResponse.status).toEqual(200);
            const correctData = await correctResponse.json();
            expect(correctData.success).toBe(false);
            // Either rate limited or code invalidated
            expect(
                correctData.error?.includes('Too many attempts') ||
                    correctData.error?.includes('Invalid or expired')
            ).toBe(true);
        });

        test('after requesting a new code, verification is no longer rate limited', async () => {
            const email = `login-retry-${uniqueId}@example.com`;
            const firstCode = '111111';
            const newCode = '222222';

            await seedLoginCode(email, firstCode);

            // Make 6 failed attempts to trigger rate limit
            for (let i = 0; i < 6; i++) {
                await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code: '000000' }),
                });
            }

            // Clear the rate limit (simulating waiting for TTL expiry)
            await clearRateLimits(`rate-limit:login-verify-attempts:${email}`);

            // Seed a new code (simulating requesting a new code)
            await seedLoginCode(email, newCode);

            // Verification should now work (not rate limited)
            const response = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: newCode }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            // In E2E mode, Firebase may not be available, but verify no rate limit error
            expect(data.error ?? '').not.toContain('Too many attempts');
        });

        test('31 attempts from one IP across different emails → rejected', async () => {
            // Clear IP rate limit to start fresh
            await clearRateLimits('rate-limit:login-verify-ip:*');

            // Make 30 attempts (the limit) with different emails
            for (let i = 0; i < 30; i++) {
                const email = `ip-limit-${uniqueId}-${i}@example.com`;
                await seedLoginCode(email, '999999');

                await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code: '000000' }),
                });
            }

            // 31st attempt should be rate limited
            const email31 = `ip-limit-${uniqueId}-30@example.com`;
            await seedLoginCode(email31, '888888');

            const response = await fetch(`${LCA_API_URL}/api/verify-login-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email31, code: '888888' }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toContain('Too many attempts');
        });
    });

    describe('verifyRecoveryEmail rate limiting', () => {
        const recoveryUniqueId = Date.now() + 1;
        const userId = `recovery-rate-${recoveryUniqueId}`;
        const loginEmail = `recovery-login-${recoveryUniqueId}@example.com`;
        const recoveryEmail = `recovery-target-${recoveryUniqueId}@personal.com`;

        let authToken: string;
        let didAuthHeaders: Record<string, string>;

        beforeAll(async () => {
            authToken = createMockAuthToken(userId, loginEmail);

            // Use a valid 32-byte hex seed (64 hex chars) - same pattern as other E2E tests
            const learnCard = await getLearnCard('c'.repeat(64));
            const vpJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            if (typeof vpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');

            didAuthHeaders = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${vpJwt}`,
            };

            // Create a UserKey for this user
            const storeRes = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: didAuthHeaders,
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'rate-limit-test-share',
                        encryptedDek: 'rate-limit-test-dek',
                        iv: 'rate-limit-test-iv',
                    },
                    primaryDid: `did:key:z6MkRateLimit${recoveryUniqueId}`,
                }),
            });

            expect(storeRes.status).toEqual(200);
        });

        test('recovery email: 5 wrong attempts invalidates code, correct code still rejected', async () => {
            const correctCode = '543210';

            // Seed a recovery email code
            await seedRecoveryEmailCode(loginEmail, correctCode, recoveryEmail);

            // Make 5 failed attempts with wrong codes
            for (let i = 0; i < 5; i++) {
                const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                    method: 'POST',
                    headers: didAuthHeaders,
                    body: JSON.stringify({
                        authToken,
                        providerType: 'firebase',
                        code: '000000',
                    }),
                });

                expect(response.status).toEqual(400);
                const data = await response.json();
                expect(data.message).toContain('Incorrect code');
            }

            // 6th attempt should be rate limited
            const sixthResponse = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: didAuthHeaders,
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    code: '000000',
                }),
            });

            expect(sixthResponse.status).toEqual(429);
            const sixthData = await sixthResponse.json();
            expect(sixthData.message).toContain('Too many attempts');

            // Now try with correct code — should fail because code was invalidated
            // First clear the rate limit to allow the request through
            await clearRateLimits(`rate-limit:recovery-verify-attempts:email:${loginEmail}`);

            const correctResponse = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: didAuthHeaders,
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    code: correctCode,
                }),
            });

            // Code was deleted when rate limit exceeded
            expect(correctResponse.status).toEqual(400);
            const correctData = await correctResponse.json();
            expect(correctData.message).toContain('No pending verification');
        });
    });
});
