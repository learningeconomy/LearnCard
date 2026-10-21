import { randomUUID } from 'crypto';

import cache from '@cache';
import { client } from '@mongo';
import { getUserKeysCollection, type MongoUserKeyType } from '@models';
import { checkRateLimit, clearRateLimit } from '@helpers/rateLimit.helpers';

import { getClient } from './helpers/getClient';

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    await client.connect();
});

afterAll(async () => {
    await client.close();
});

describe('LC-2207 recovery email rate limiting by auth provider', () => {
    const uid = randomUUID();
    const email = `login-${uid}@example.com`;
    const recoveryEmail = `recovery-${uid}@example.com`;
    const did = `did:key:z${uid}`;
    const codeKey = `recovery_email_code:firebase:${uid}`;
    const attemptKey = `recovery-verify-attempts:firebase:${uid}`;
    const contactAttemptKey = `recovery-verify-attempts:email:${email}`;
    const payload = Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url');
    const input = { authToken: `header.${payload}.signature`, providerType: 'firebase' as const };
    const caller = getClient({ did, isChallengeValid: true });

    beforeEach(async () => {
        const now = new Date();
        const userKey: MongoUserKeyType = {
            contactMethod: { type: 'email', value: email },
            authProviders: [{ type: 'firebase', id: uid }],
            primaryDid: did,
            linkedDids: [],
            keyProvider: 'sss',
            authShare: { encryptedData: 'auth-share', encryptedDek: 'dek', iv: 'iv' },
            shareVersion: 1,
            shareUpdatedAt: now,
            previousAuthShares: [],
            securityLevel: 'basic',
            recoveryMethods: [],
            migratedFromWeb3Auth: false,
            sssActivationState: 'active',
            createdAt: now,
            updatedAt: now,
        };
        await getUserKeysCollection().insertOne(userKey);
        await cache.set(codeKey, JSON.stringify({ code: '123456', email: recoveryEmail }), 900);
    });

    afterEach(async () => {
        await getUserKeysCollection().deleteMany({ 'authProviders.id': uid });
        await cache.delete([codeKey]);
        await clearRateLimit(attemptKey);
        await clearRateLimit(contactAttemptKey);
    });

    it('locks out after five failures and deletes the pending code', async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
            await expect(
                caller.keys.verifyRecoveryEmail({ ...input, code: '000000' })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Incorrect code. Please try again.',
            });
        }

        await expect(
            caller.keys.verifyRecoveryEmail({ ...input, code: '123456' })
        ).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many attempts. Please resend code.',
        });
        expect(await cache.get(codeKey)).toBeFalsy();
        await clearRateLimit(attemptKey);
        await expect(
            caller.keys.verifyRecoveryEmail({ ...input, code: '123456' })
        ).rejects.toMatchObject({ message: 'No pending verification. Please request a new code.' });
    });

    it('clears the provider counter on success without using a recycled contact counter', async () => {
        await cache.set(`rate-limit:${contactAttemptKey}`, '99', 900);
        await expect(
            caller.keys.verifyRecoveryEmail({ ...input, code: '000000' })
        ).rejects.toThrow();
        expect(await cache.get(`rate-limit:${attemptKey}`)).toBe('1');
        await expect(
            caller.keys.verifyRecoveryEmail({ ...input, code: '123456' })
        ).resolves.toMatchObject({ success: true });
        expect(await cache.get(`rate-limit:${attemptKey}`)).toBeFalsy();
        expect(await cache.get(`rate-limit:${contactAttemptKey}`)).toBe('99');
        expect(await cache.get(codeKey)).toBeFalsy();
        expect(await getUserKeysCollection().findOne({ 'authProviders.id': uid })).toMatchObject({
            recoveryEmail,
        });
    });

    it('clears the provider counter when resending and accepts the new code', async () => {
        await cache.set(`rate-limit:${attemptKey}`, '6', 900);
        await caller.keys.addRecoveryEmail({ ...input, email: recoveryEmail });
        expect(await cache.get(`rate-limit:${attemptKey}`)).toBeFalsy();
        const pending = JSON.parse((await cache.get(codeKey))!);
        expect(pending.code).toMatch(/^\d{6}$/);
        await expect(
            caller.keys.verifyRecoveryEmail({ ...input, code: pending.code })
        ).resolves.toMatchObject({ success: true });
    });

    it('preserves the QR Redis prefix in the shared helper', async () => {
        const key = `create:${uid}`;
        try {
            expect(await checkRateLimit(key, 1, 60, 'qr-login:rate:')).toBe(true);
            expect(await checkRateLimit(key, 1, 60, 'qr-login:rate:')).toBe(false);
            expect(await cache.get(`qr-login:rate:${key}`)).toBe('2');
            expect(await cache.get(`rate-limit:${key}`)).toBeFalsy();
        } finally {
            await clearRateLimit(key, 'qr-login:rate:');
        }
    });
});
