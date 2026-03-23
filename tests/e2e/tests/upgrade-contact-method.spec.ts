import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';

import { getLearnCard } from './helpers/learncard.helpers';
import { URLS, PORTS } from './helpers/ports';

const LCA_API_URL = URLS.lcaApiBase;

// redis3 is used by lca-api — exposed on host port 6381
const redis = new Redis({ port: PORTS.redis3 });

const createMockAuthToken = (
    userId: string,
    opts: { email?: string; phone?: string }
) => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');

    const payload = Buffer.from(
        JSON.stringify({
            sub: userId,
            ...(opts.email ? { email: opts.email } : {}),
            ...(opts.phone ? { phone_number: opts.phone } : {}),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        })
    ).toString('base64url');

    return `${header}.${payload}.`;
};

/**
 * Seed a login OTP code directly into Redis so the upgradeContactMethod
 * route can verify it. The key pattern matches sendLoginVerificationCode.
 */
const seedOtpCode = async (email: string, code: string): Promise<void> => {
    const redisKey = `login-code:${email}:${code}`;

    await redis.set(redisKey, '1', 'EX', 300);
};

describe('Upgrade Contact Method (phone → email)', () => {
    const uniqueId = Date.now();
    const phoneUserId = `phone-user-${uniqueId}`;
    const phoneNumber = `+1555000${uniqueId.toString().slice(-4)}`;
    const targetEmail = `upgrade-${uniqueId}@example.com`;
    const otpCode = '123456';

    let phoneToken: string;
    let didAuthHeaders: Record<string, string>;

    beforeAll(async () => {
        phoneToken = createMockAuthToken(phoneUserId, { phone: phoneNumber });

        // Create a LearnCard for DID-Auth on didRoute endpoints
        const learnCard = await getLearnCard('b'.repeat(64));
        const vpJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        if (typeof vpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');

        didAuthHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${vpJwt}`,
        };

        // Create a phone-based UserKey so upgradeContactMethod has something to upgrade
        const storeRes = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: didAuthHeaders,
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'phone-user-auth-share',
                    encryptedDek: 'phone-user-dek',
                    iv: 'phone-user-iv',
                },
                primaryDid: `did:key:z6MkPhone${uniqueId}`,
            }),
        });

        expect(storeRes.status).toEqual(200);
    });

    afterAll(async () => {
        await redis.quit();
    });

    // ── Validation errors (before any DB or OTP checks) ─────────────

    test('rejects missing previousPhone', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                email: targetEmail,
                code: otpCode,
                // previousPhone intentionally omitted
            }),
        });

        expect(response.status).toEqual(400);
    });

    test('rejects invalid email format', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: phoneNumber,
                email: 'not-an-email',
                code: otpCode,
            }),
        });

        expect(response.status).toEqual(400);
    });

    test('rejects code that is not exactly 6 characters', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: phoneNumber,
                email: targetEmail,
                code: '12345', // 5 digits — too short
            }),
        });

        expect(response.status).toEqual(400);
    });

    // ── OTP verification ────────────────────────────────────────────

    test('rejects invalid / expired OTP code', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: phoneNumber,
                email: targetEmail,
                code: '999999', // no code seeded for this
            }),
        });

        // OTP check fails → BAD_REQUEST
        expect(response.status).toEqual(400);

        const data = await response.json();
        expect(data.message).toContain('Invalid or expired code');
    });

    // ── Phone not found ─────────────────────────────────────────────

    test('rejects when phone number has no UserKey', async () => {
        const unknownPhone = '+15559999999';
        const email = `unknown-phone-${uniqueId}@example.com`;

        await seedOtpCode(email, otpCode);

        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: unknownPhone,
                email,
                code: otpCode,
            }),
        });

        expect(response.status).toEqual(404);

        const data = await response.json();
        expect(data.message).toContain('No account found');
    });

    // ── Ownership check ─────────────────────────────────────────────

    test('rejects when authenticated user does not own the phone UserKey', async () => {
        // Create a different user's token (different sub) but use the SAME phone number
        const otherUserId = `other-user-${uniqueId}`;
        const otherToken = createMockAuthToken(otherUserId, { phone: '+15550000000' });
        const email = `ownership-test-${uniqueId}@example.com`;

        await seedOtpCode(email, otpCode);

        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: otherToken,
                providerType: 'firebase',
                previousPhone: phoneNumber, // belongs to phoneUserId, not otherUserId
                email,
                code: otpCode,
            }),
        });

        expect(response.status).toEqual(403);

        const data = await response.json();
        expect(data.message).toContain('do not have permission');
    });

    // ── Email conflict (another UserKey already uses this email) ────

    test('rejects when target email is already used by another UserKey', async () => {
        // First, create another user whose contact method is the target email
        const conflictUserId = `conflict-user-${uniqueId}`;
        const conflictEmail = `conflict-${uniqueId}@example.com`;
        const conflictToken = createMockAuthToken(conflictUserId, { email: conflictEmail });

        // Create a UserKey with that email as contact method
        const conflictLearnCard = await getLearnCard('c'.repeat(64));
        const conflictVpJwt = await conflictLearnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        if (typeof conflictVpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');

        await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${conflictVpJwt}`,
            },
            body: JSON.stringify({
                authToken: conflictToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'conflict-auth-share',
                    encryptedDek: 'conflict-dek',
                    iv: 'conflict-iv',
                },
                primaryDid: `did:key:z6MkConflict${uniqueId}`,
            }),
        });

        // Now try to upgrade our phone user to the same email
        await seedOtpCode(conflictEmail, otpCode);

        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: phoneNumber,
                email: conflictEmail,
                code: otpCode,
            }),
        });

        // upgradeContactMethod model returns false → CONFLICT
        expect(response.status).toEqual(409);

        const data = await response.json();
        expect(data.message).toContain('already associated');
    });

    // ── Happy path ──────────────────────────────────────────────────

    test('successfully upgrades phone contact method to email', async () => {
        await seedOtpCode(targetEmail, otpCode);

        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: phoneNumber,
                email: targetEmail,
                code: otpCode,
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.customToken).toBeDefined();
        expect(data.customToken).toContain('e2e-custom-token');
    });

    test('UserKey is now accessible via the new email contact method', async () => {
        // After upgrade, getAuthShare with the email-based token should work
        const emailToken = createMockAuthToken(phoneUserId, { email: targetEmail });

        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: emailToken,
                providerType: 'firebase',
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data).not.toBeNull();
        expect(data.authShare?.encryptedData).toBe('phone-user-auth-share');
    });

    test('UserKey is no longer accessible via the old phone contact method', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken, // phone-based token
                providerType: 'firebase',
            }),
        });

        expect(response.status).toEqual(200);

        // Should return null — no UserKey exists for this phone anymore
        const data = await response.json();
        expect(data).toBeNull();
    });

    test('OTP code is consumed and cannot be reused', async () => {
        // The code was already consumed by the successful upgrade above
        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                previousPhone: phoneNumber,
                email: targetEmail,
                code: otpCode,
            }),
        });

        expect(response.status).toEqual(400);

        const data = await response.json();
        expect(data.message).toContain('Invalid or expired code');
    });
});
