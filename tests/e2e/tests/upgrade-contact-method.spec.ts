import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';

import { getLearnCard } from './helpers/learncard.helpers';

const LCA_API_URL = 'http://localhost:5200';

// redis3 is used by lca-api — exposed on host port 6381
const redis = new Redis({ port: 6381 });

const createChallengeHeaders = async (learnCard: Awaited<ReturnType<typeof getLearnCard>>) => {
    const challenge = crypto.randomUUID();
    await redis.set(`challenge|${learnCard.id.did()}|${challenge}`, 'valid', 'EX', 300);
    const vpJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
    if (typeof vpJwt !== 'string') throw new Error('Failed to create DID-Auth VP');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${vpJwt}` };
};

afterAll(async () => {
    await redis.quit();
});

const createMockAuthToken = (userId: string, opts: { email?: string; phone?: string }) => {
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

    beforeAll(async () => {
        phoneToken = createMockAuthToken(phoneUserId, { phone: phoneNumber });

        // Only the setup write requires challenge-bound DID auth; upgrade is openRoute.
        const learnCard = await getLearnCard('b'.repeat(64));

        // Create a phone-based UserKey so upgradeContactMethod has something to upgrade
        const storeRes = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: await createChallengeHeaders(learnCard),
            body: JSON.stringify({
                authToken: phoneToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'phone-user-auth-share',
                    encryptedDek: 'phone-user-dek',
                    iv: 'phone-user-iv',
                },
                primaryDid: learnCard.id.did(),
            }),
        });

        expect(storeRes.status).toEqual(200);
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

        expect(response.status).toEqual(404);

        const data = await response.json();
        expect(data.message).toContain('No account found');
    });

    // Contact metadata is non-unique; the immutable provider ID identifies the account.

    test('allows shared contact email without merging provider identities', async () => {
        // First, create another user whose contact method is the target email
        const conflictUserId = `conflict-user-${uniqueId}`;
        const conflictEmail = `conflict-${uniqueId}@example.com`;
        const conflictToken = createMockAuthToken(conflictUserId, { email: conflictEmail });

        // Create a UserKey with that email as contact method
        const conflictLearnCard = await getLearnCard('c'.repeat(64));
        const storeResponse = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: await createChallengeHeaders(conflictLearnCard),
            body: JSON.stringify({
                authToken: conflictToken,
                providerType: 'firebase',
                authShare: {
                    encryptedData: 'conflict-auth-share',
                    encryptedDek: 'conflict-dek',
                    iv: 'conflict-iv',
                },
                primaryDid: conflictLearnCard.id.did(),
            }),
        });

        expect(storeResponse.status).toEqual(200);

        // Use a separate phone account so the main happy-path fixture remains unchanged.
        const sharedPhone = '+15558888888';
        const sharedToken = createMockAuthToken(`shared-contact-${uniqueId}`, {
            phone: sharedPhone,
        });
        const sharedLearnCard = await getLearnCard('8'.repeat(64));
        const sharedStore = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'PUT',
            headers: await createChallengeHeaders(sharedLearnCard),
            body: JSON.stringify({
                authToken: sharedToken,
                providerType: 'firebase',
                primaryDid: sharedLearnCard.id.did(),
                authShare: { encryptedData: 'shared-contact-share', encryptedDek: 'dek', iv: 'iv' },
            }),
        });
        expect(sharedStore.status).toEqual(200);

        await seedOtpCode(conflictEmail, otpCode);

        const response = await fetch(`${LCA_API_URL}/api/keys/upgrade-contact-method`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: sharedToken,
                providerType: 'firebase',
                previousPhone: sharedPhone,
                email: conflictEmail,
                code: otpCode,
            }),
        });

        expect(response.status).toEqual(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        for (const [authToken, expectedData, expectedDid] of [
            [sharedToken, 'shared-contact-share', sharedLearnCard.id.did()],
            [conflictToken, 'conflict-auth-share', conflictLearnCard.id.did()],
        ]) {
            const readResponse = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken, providerType: 'firebase' }),
            });
            expect(readResponse.status).toEqual(200);
            expect(await readResponse.json()).toMatchObject({
                authShare: { encryptedData: expectedData },
                primaryDid: expectedDid,
            });
        }
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

    test('the same provider ID still resolves the UserKey with an old phone claim', async () => {
        const response = await fetch(`${LCA_API_URL}/api/keys/auth-share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authToken: phoneToken, // phone-based token
                providerType: 'firebase',
            }),
        });

        expect(response.status).toEqual(200);

        // Contact claims do not control lookup; the immutable provider ID does.
        const data = await response.json();
        expect(data).not.toBeNull();
        expect(data.authShare?.encryptedData).toBe('phone-user-auth-share');
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

    test('a fresh OTP cannot upgrade the old phone again after contact metadata changed', async () => {
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
        expect(response.status).toBe(404);
        expect(await response.json()).toMatchObject({
            message: 'No account found for the provided phone number.',
        });
    });
});
