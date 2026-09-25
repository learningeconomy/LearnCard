import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';

import { getLearnCard } from './helpers/learncard.helpers';

const LCA_API_URL = 'http://localhost:5200';

// redis3 is used by lca-api — exposed on host port 6381
const redis = new Redis({ port: 6381 });

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
 * Seed a recovery email verification code directly into Redis.
 * Key pattern: `recovery_email_code:{authProvider.type}:{authProvider.id}`
 * Value: JSON.stringify({ code, email })
 */
const seedRecoveryEmailCode = async (
    userId: string,
    code: string,
    recoveryEmail: string
): Promise<void> => {
    const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}firebase:${userId}`;

    await redis.set(cacheKey, JSON.stringify({ code, email: recoveryEmail }), 'EX', 900);
};

type TestLearnCard = Awaited<ReturnType<typeof getLearnCard>>;

/**
 * Sensitive key routes require a single-use DID-Auth challenge. Seed one the
 * way lca-api's challenge cache stores it, then sign a fresh VP bound to it.
 */
const createChallengeHeaders = async (
    learnCard: TestLearnCard
): Promise<Record<string, string>> => {
    const challenge = crypto.randomUUID();
    await redis.set(`challenge|${learnCard.id.did()}|${challenge}`, 'valid', 'EX', 300);

    const vpJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
    if (typeof vpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vpJwt}`,
    };
};

const storeAuthShare = async (
    learnCard: TestLearnCard,
    authToken: string,
    encryptedData: string
): Promise<void> => {
    const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
        method: 'PUT',
        headers: await createChallengeHeaders(learnCard),
        body: JSON.stringify({
            authToken,
            providerType: 'firebase',
            authShare: { encryptedData, encryptedDek: `${encryptedData}-dek`, iv: 'test-iv' },
            primaryDid: learnCard.id.did(),
        }),
    });

    expect(response.status).toEqual(200);
};

/** Well-formed but undeliverable envelope; these tests stop before relay delivery. */
const relayPayload = {
    version: 1,
    algorithm: 'P-256-HKDF-SHA256-AES-256-GCM',
    keyId: 'e2e-test-key',
    ephemeralPublicKey: 'e2e-ephemeral-public-key',
    salt: 'e2e-salt',
    iv: 'e2e-iv',
    ciphertext: 'e2e-ciphertext',
};

afterAll(async () => {
    await redis.quit();
});

describe('Recovery Email Verification & Email Backup', () => {
    const uniqueId = Date.now();
    const userId = `recovery-full-${uniqueId}`;
    const loginEmail = `login-${uniqueId}@example.com`;
    const recoveryEmail = `recovery-${uniqueId}@personal.com`;
    const otpCode = '654321';

    let authToken: string;
    let learnCard: TestLearnCard;
    const didAuthHeaders = () => createChallengeHeaders(learnCard);

    beforeAll(async () => {
        authToken = createMockAuthToken(userId, loginEmail);
        learnCard = await getLearnCard('d'.repeat(64));

        await storeAuthShare(learnCard, authToken, 'recovery-test-auth-share');
    });

    // ── addRecoveryEmail ────────────────────────────────────────────

    describe('addRecoveryEmail', () => {
        test('requires DID auth (rejects without VP)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    email: recoveryEmail,
                }),
            });

            expect(response.status).toEqual(401);
        });

        test('rejects when recovery email matches login email', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/add`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    email: loginEmail, // same as login email
                }),
            });

            expect(response.status).toEqual(400);

            const data = await response.json();
            expect(data.message).toContain('different from your login email');
        });

        test('rejects invalid email format', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/add`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    email: 'not-an-email',
                }),
            });

            expect(response.status).toEqual(400);
        });

        test('succeeds with a valid different email', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/add`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    email: recoveryEmail,
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });
    });

    // ── verifyRecoveryEmail ─────────────────────────────────────────

    describe('verifyRecoveryEmail', () => {
        test('requires DID auth (rejects without VP)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    code: '123456',
                }),
            });

            expect(response.status).toEqual(401);
        });

        test('rejects wrong verification code', async () => {
            // Seed a known code so there IS a pending verification
            await seedRecoveryEmailCode(userId, otpCode, recoveryEmail);

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    code: '000000', // wrong code
                }),
            });

            expect(response.status).toEqual(400);

            const data = await response.json();
            expect(data.message).toContain('Incorrect code');
        });

        test('succeeds with correct verification code', async () => {
            // Re-seed the code (previous test didn't consume it, but re-seed to be safe)
            await seedRecoveryEmailCode(userId, otpCode, recoveryEmail);

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    code: otpCode,
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.maskedEmail).toBeDefined();
            // maskedEmail should mask everything except first char of local part
            expect(data.maskedEmail).toContain('@personal.com');
        });

        test('code is consumed after successful verification', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    code: otpCode, // already consumed
                }),
            });

            expect(response.status).toEqual(400);

            const data = await response.json();
            expect(data.message).toContain('No pending verification');
        });
    });

    // ── getRecoveryEmail ────────────────────────────────────────────

    describe('getRecoveryEmail', () => {
        test('returns masked recovery email after verification', async () => {
            const params = new URLSearchParams({
                authToken,
                providerType: 'firebase',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.recoveryEmail).not.toBeNull();
            expect(data.recoveryEmail).toContain('@personal.com');
        });

        test('returns null for user with no UserKey', async () => {
            const noKeyToken = createMockAuthToken('no-key-user', 'nokey@example.com');

            const params = new URLSearchParams({
                authToken: noKeyToken,
                providerType: 'firebase',
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email?${params}`, {
                method: 'GET',
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.recoveryEmail).toBeNull();
        });
    });

    // ── maskedRecoveryEmail in getAuthShare ──────────────────────────

    describe('maskedRecoveryEmail in getAuthShare', () => {
        test('getAuthShare returns maskedRecoveryEmail after verification', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.maskedRecoveryEmail).not.toBeNull();
            expect(data.maskedRecoveryEmail).toContain('@personal.com');
        });
    });

    // ── sendEmailBackup ─────────────────────────────────────────────

    describe('sendEmailBackup', () => {
        const backupInput = (overrides: Record<string, unknown> = {}) => ({
            authToken,
            providerType: 'firebase',
            relayPayload,
            confirmationCode: '123456',
            email: recoveryEmail,
            ...overrides,
        });

        test('requires DID auth (rejects without VP)', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupInput()),
            });

            expect(response.status).toEqual(401);
        });

        test('rejects the legacy plaintext share payload', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    emailShare: 'plaintext-share-data',
                    email: recoveryEmail,
                }),
            });

            expect(response.status).toEqual(400);
        });

        test('rejects a target other than the verified recovery email', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify(backupInput({ email: 'someone-else@example.com' })),
            });

            expect(response.status).toEqual(400);

            const data = await response.json();
            expect(data.message).toContain('Use the verified recovery email');
        });

        test('rejects a stale share version before delivery', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: await didAuthHeaders(),
                body: JSON.stringify(backupInput({ shareVersion: 99 })),
            });

            expect(response.status).toEqual(409);
        });

        test('rejects a user without a verified recovery email', async () => {
            const noRecoveryToken = createMockAuthToken(
                `no-recovery-${uniqueId}`,
                `no-recovery-${uniqueId}@example.com`
            );
            const noRecoveryLearnCard = await getLearnCard('f'.repeat(64));

            await storeAuthShare(noRecoveryLearnCard, noRecoveryToken, 'no-recovery-share');

            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: await createChallengeHeaders(noRecoveryLearnCard),
                body: JSON.stringify(
                    backupInput({
                        authToken: noRecoveryToken,
                        email: 'no-recovery-target@example.com',
                    })
                ),
            });

            expect(response.status).toEqual(400);

            const data = await response.json();
            expect(data.message).toContain('No verified recovery email');
        });
    });
});

// ── Share Version Negotiation ────────────────────────────────────────

describe('getAuthShare with shareVersion (version negotiation)', () => {
    const uniqueId = Date.now() + 1;
    const userId = `version-user-${uniqueId}`;
    const email = `version-${uniqueId}@example.com`;

    let authToken: string;

    beforeAll(async () => {
        authToken = createMockAuthToken(userId, email);
        const learnCard = await getLearnCard('e'.repeat(64));

        // Each write bumps shareVersion and retains the previous share in history.
        await storeAuthShare(learnCard, authToken, 'v1-share-data');
        await storeAuthShare(learnCard, authToken, 'v2-share-data');
        await storeAuthShare(learnCard, authToken, 'v3-share-data');
    });

    test('default getAuthShare returns current (v3) share', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.shareVersion).toBe(3);
        expect(data.authShare?.encryptedData).toBe('v3-share-data');
    });

    test('requesting shareVersion 3 (current) returns current share', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                shareVersion: 3,
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.authShare?.encryptedData).toBe('v3-share-data');
    });

    test('requesting shareVersion 2 returns older share from history', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                shareVersion: 2,
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.authShare?.encryptedData).toBe('v2-share-data');
    });

    test('requesting shareVersion 1 returns oldest share from history', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                shareVersion: 1,
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.authShare?.encryptedData).toBe('v1-share-data');
    });

    test('requesting non-existent shareVersion returns null authShare', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                shareVersion: 99,
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.authShare).toBeNull();
    });
});
