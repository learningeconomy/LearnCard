import { randomUUID } from 'crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from '@mongo';
import cache from '@cache';
import { createUserKeysIndexes, getUserKeysCollection } from '@models';
import { getClassLinkIdentitiesCollection } from '../src/models/ClassLinkIdentity';
import { getTranscriptRequestsCollection } from '../src/models/TranscriptRequest';
import {
    isSyntheticEmail,
    SYNTHETIC_EMAIL_DOMAIN,
    syntheticEmailForUid,
} from '../src/helpers/syntheticEmail.helpers';
import { getClient, getUser } from './helpers/getClient';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../src/services/delivery', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/services/delivery')>()),
    getDeliveryService: () => ({ send }),
}));

/** The shape of a Firebase ID token for a ClassLink custom-token user (E2E decoding). */
const tokenFor = (uid: string, email: string): string =>
    `header.${Buffer.from(
        JSON.stringify({
            sub: uid,
            email,
            email_verified: false,
            firebase: { sign_in_provider: 'custom' },
        })
    ).toString('base64url')}.signature`;

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    await client.connect();
    await createUserKeysIndexes();
});

beforeEach(() => {
    send.mockReset().mockResolvedValue(undefined);
});

describe('synthetic ClassLink account addresses', () => {
    it('are reserved, undeliverable and recognized case-insensitively', () => {
        expect(SYNTHETIC_EMAIL_DOMAIN).toBe('users.classlink.invalid');
        expect(syntheticEmailForUid('classlink_ABC')).toBe('classlink_abc@users.classlink.invalid');
        expect(isSyntheticEmail(' Classlink_abc@USERS.classlink.invalid ')).toBe(true);
        expect(isSyntheticEmail('student@example.edu')).toBe(false);
        expect(isSyntheticEmail('x@evil-users.classlink.invalid.example')).toBe(false);
        expect(isSyntheticEmail(undefined)).toBe(false);
    });

    it('let a student without a trusted school email set up and read wallet keys', async () => {
        const uid = `classlink_${randomUUID().replace(/-/g, '').slice(0, 28)}`;
        const token = tokenFor(uid, syntheticEmailForUid(uid));
        const { learnCard } = await getUser('e'.repeat(64));
        const did = learnCard.id.did();
        const caller = getClient({ did, isChallengeValid: true });
        try {
            await expect(
                caller.keys.storeAuthShare({
                    authToken: token,
                    providerType: 'firebase',
                    primaryDid: did,
                    authShare: { encryptedData: 'share', encryptedDek: 'dek', iv: 'iv' },
                })
            ).resolves.toBeDefined();
            expect(
                (await caller.keys.getAuthShare({ authToken: token, providerType: 'firebase' }))
                    ?.authShare?.encryptedData
            ).toBe('share');
            expect(
                await getUserKeysCollection().findOne({ 'authProviders.id': uid })
            ).toMatchObject({
                contactMethod: { type: 'email', value: syntheticEmailForUid(uid) },
            });
            expect(send).not.toHaveBeenCalled();
        } finally {
            await getUserKeysCollection().deleteMany({ 'authProviders.id': uid });
        }
    });

    it('never get an email sign-in code', async () => {
        const email = syntheticEmailForUid(`classlink_${randomUUID().slice(0, 8)}`);
        // Same answer as for any address, so nothing is learned, but nothing is stored or sent.
        await expect(getClient().firebase.sendLoginVerificationCode({ email })).resolves.toEqual({
            success: true,
        });
        expect(send).not.toHaveBeenCalled();
        expect(await cache.get(`login-code:${email}`)).toBeFalsy();
        await expect(
            getClient().firebase.verifyLoginCode({ email, code: '123456' })
        ).resolves.toMatchObject({ success: false, error: 'Invalid or expired code.' });
    });
});

describe('account deletion cascade from keys.deleteUserKey', () => {
    it('removes the account ClassLink identity and transcript requests after deleting the key', async () => {
        const uid = `classlink_${randomUUID().replace(/-/g, '').slice(0, 28)}`;
        const token = tokenFor(uid, syntheticEmailForUid(uid));
        const { learnCard } = await getUser('9'.repeat(64));
        const did = learnCard.id.did();
        const caller = getClient({ did, isChallengeValid: true });
        const identityKey = `classlink:tenant-test:v1:${randomUUID()}`;
        await caller.keys.storeAuthShare({
            authToken: token,
            providerType: 'firebase',
            primaryDid: did,
            authShare: { encryptedData: 'share', encryptedDek: 'dek', iv: 'iv' },
        });
        await getClassLinkIdentitiesCollection().insertOne({
            identityKey,
            tenantId: 'tenant-test',
            sub: 'sub',
            role: 'student',
            state: 'XX',
            firebaseUid: uid,
            subject: randomUUID(),
            lastAuthTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await getTranscriptRequestsCollection().insertOne({
            jti: randomUUID(),
            firebaseUid: uid,
            did,
            identityKey,
            state: 'XX',
            consentAt: new Date(),
            requestedAt: new Date(),
            status: 'requested',
        });

        await expect(
            caller.keys.deleteUserKey({
                authToken: token,
                providerType: 'firebase',
                challenge: 'challenge',
            })
        ).resolves.toEqual({ success: true });

        expect(await getUserKeysCollection().countDocuments({ 'authProviders.id': uid })).toBe(0);
        expect(await getClassLinkIdentitiesCollection().countDocuments({ identityKey })).toBe(0);
        expect(await getTranscriptRequestsCollection().countDocuments({ identityKey })).toBe(0);
    });
});
