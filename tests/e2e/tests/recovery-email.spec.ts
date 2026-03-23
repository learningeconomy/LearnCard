import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';

import { getLearnCard } from './helpers/learncard.helpers';
import { PORTS, URLS } from './helpers/ports';

const LCA_API_URL = URLS.lcaApiBase;

// redis3 is used by lca-api
const redis = new Redis({ port: PORTS.redis1 + 2 });

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
 * Key pattern: `recovery_email_code:{contactMethod.type}:{contactMethod.value}`
 * Value: JSON.stringify({ code, email })
 */
const seedRecoveryEmailCode = async (
    contactEmail: string,
    code: string,
    recoveryEmail: string
): Promise<void> => {
    const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}email:${contactEmail}`;

    await redis.set(cacheKey, JSON.stringify({ code, email: recoveryEmail }), 'EX', 900);
};

describe('Recovery Email Verification & Email Backup', () => {
    const uniqueId = Date.now();
    const userId = `recovery-full-${uniqueId}`;
    const loginEmail = `login-${uniqueId}@example.com`;
    const recoveryEmail = `recovery-${uniqueId}@personal.com`;
    const otpCode = '654321';

    let authToken: string;
    let didAuthHeaders: Record<string, string>;

    beforeAll(async () => {
        authToken = createMockAuthToken(userId, loginEmail);

        const learnCard = await getLearnCard('d'.repeat(64));
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
                    encryptedData: 'recovery-test-auth-share',
                    encryptedDek: 'recovery-test-dek',
                    iv: 'recovery-test-iv',
                },
                primaryDid: `did:key:z6MkRecFull${uniqueId}`,
            }),
        });

        expect(storeRes.status).toEqual(200);
    });

    afterAll(async () => {
        await redis.quit();
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
                headers: didAuthHeaders,
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
                headers: didAuthHeaders,
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
                headers: didAuthHeaders,
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
            await seedRecoveryEmailCode(loginEmail, otpCode, recoveryEmail);

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: didAuthHeaders,
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
            await seedRecoveryEmailCode(loginEmail, otpCode, recoveryEmail);

            const response = await fetch(`${LCA_API_URL}/api/keys/recovery-email/verify`, {
                method: 'POST',
                headers: didAuthHeaders,
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
                headers: didAuthHeaders,
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
        test('rejects when neither email nor useRecoveryEmail is provided', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    emailShare: 'test-share-data',
                }),
            });

            expect(response.status).toEqual(400);

            const data = await response.json();
            expect(data.message).toContain('email address or useRecoveryEmail');
        });

        test('succeeds with explicit email address', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    emailShare: 'backup-share-data-explicit',
                    email: 'explicit-target@example.com',
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('succeeds with useRecoveryEmail after verified recovery email', async () => {
            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken,
                    providerType: 'firebase',
                    emailShare: 'backup-share-data-recovery',
                    useRecoveryEmail: true,
                }),
            });

            expect(response.status).toEqual(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        test('rejects useRecoveryEmail for user without verified recovery email', async () => {
            const noRecoveryToken = createMockAuthToken(
                `no-recovery-${uniqueId}`,
                `no-recovery-${uniqueId}@example.com`
            );

            // Create a UserKey for this user (no recovery email)
            await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'PUT',
                headers: didAuthHeaders,
                body: JSON.stringify({
                    authToken: noRecoveryToken,
                    providerType: 'firebase',
                    authShare: {
                        encryptedData: 'no-recovery-share',
                        encryptedDek: 'no-recovery-dek',
                        iv: 'no-recovery-iv',
                    },
                    primaryDid: `did:key:z6MkNoRecovery${uniqueId}`,
                }),
            });

            const response = await fetch(`${LCA_API_URL}/api/keys/email-backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authToken: noRecoveryToken,
                    providerType: 'firebase',
                    emailShare: 'backup-share-data',
                    useRecoveryEmail: true,
                }),
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
    let didAuthHeaders: Record<string, string>;

    beforeAll(async () => {
        authToken = createMockAuthToken(userId, email);

        const learnCard = await getLearnCard('e'.repeat(64));
        const vpJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        if (typeof vpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');

        didAuthHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${vpJwt}`,
        };

        // Store v1 auth share
        await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: didAuthHeaders,
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'v1-share-data',
                    encryptedDek: 'v1-dek',
                    iv: 'v1-iv',
                },
                primaryDid: `did:key:z6MkVersion${uniqueId}`,
            }),
        });

        // Store v2 auth share (overwrites — server bumps shareVersion)
        await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: didAuthHeaders,
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'v2-share-data',
                    encryptedDek: 'v2-dek',
                    iv: 'v2-iv',
                },
                primaryDid: `did:key:z6MkVersion${uniqueId}`,
            }),
        });

        // Store v3 auth share (current)
        await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: didAuthHeaders,
            body: JSON.stringify({
                authToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'v3-share-data',
                    encryptedDek: 'v3-dek',
                    iv: 'v3-iv',
                },
                primaryDid: `did:key:z6MkVersion${uniqueId}`,
            }),
        });
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
