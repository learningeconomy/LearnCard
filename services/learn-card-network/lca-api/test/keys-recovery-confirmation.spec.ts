import { randomUUID } from 'crypto';

import { client } from '@mongo';
import { createUserKeysIndexes, getUserKeysCollection, type MongoUserKeyType } from '@models';

import { getClient, getUser } from './helpers/getClient';

const makeMockToken = (email: string, uid: string): string => {
    const payload = Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url');

    return `header.${payload}.signature`;
};

const makeUserKey = (
    email: string,
    uid: string,
    primaryDid: string,
    activationState: 'provisional' | 'active' = 'provisional'
): MongoUserKeyType => {
    const now = new Date();

    return {
        contactMethod: { type: 'email', value: email },
        authProviders: [{ type: 'firebase', id: uid }],
        primaryDid,
        linkedDids: [],
        keyProvider: 'sss',
        authShare: { encryptedData: 'auth-share', encryptedDek: 'dek', iv: 'iv' },
        shareVersion: 1,
        shareUpdatedAt: now,
        previousAuthShares: [],
        securityLevel: 'basic',
        recoveryMethods: [],
        migratedFromWeb3Auth: false,
        sssActivationState: activationState,
        provisionalCreatedAt: activationState === 'provisional' ? now : undefined,
        createdAt: now,
        updatedAt: now,
    };
};

const setVerifiedRecoveryEmail = (userKey: MongoUserKeyType, email: string): MongoUserKeyType => {
    userKey.recoveryEmail = email;
    userKey.recoveryEmailVerifiedAt = new Date();

    return userKey;
};

const makeRelayPayload = () => ({
    version: 1 as const,
    algorithm: 'P-256-HKDF-SHA256-AES-256-GCM' as const,
    keyId: 'test-relay-key',
    ephemeralPublicKey: 'BTESTEPHEMERALKEY',
    salt: 'TESTSALT',
    iv: 'TESTIV',
    ciphertext: 'TESTCIPHERTEXT',
});

const mockRelayAcceptance = () =>
    vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () =>
            new Response(JSON.stringify({ accepted: true, messageId: 'postmark-message-id' }), {
                status: 200,
            })
    );

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    process.env.ESCROW_RELAY_URL = 'https://escrow-relay.example';
    process.env.ESCROW_RELAY_AUTH_TOKEN = 'relay-auth-token';
    await client.connect();
    await createUserKeysIndexes();
});

afterAll(async () => {
    await client.close();
});

describe('P0-2 two-phase recovery enrollment', () => {
    it('rejects plaintext email shares even when an encrypted envelope is also supplied', async () => {
        const relaySpy = mockRelayAcceptance();
        const caller = getClient({ did: 'did:key:zPlaintextRejected', isChallengeValid: true });
        const plaintextRequest = {
            authToken: makeMockToken('plain@example.com', 'plain-uid'),
            providerType: 'firebase',
            relayPayload: makeRelayPayload(),
            confirmationCode: '123456',
            email: 'recovery@example.com',
            emailShare: `0001${'ab'.repeat(48)}`,
        };

        await expect(
            Reflect.apply(caller.keys.sendEmailBackup, caller.keys, [plaintextRequest])
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(relaySpy).not.toHaveBeenCalled();
        relaySpy.mockRestore();
    });

    it('fails closed when recovery-key delivery fails and records no pending method', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `delivery-failure-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('8'.repeat(64));
        const collection = getUserKeysCollection();
        const recoveryEmail = `personal-${suffix}@example.com`;
        const relaySpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify({ accepted: false, error: 'Postmark unavailable' }), {
                status: 502,
            })
        );

        await collection.insertOne(
            setVerifiedRecoveryEmail(makeUserKey(email, uid, learnCard.id.did()), recoveryEmail)
        );

        try {
            await expect(
                getClient({ did: learnCard.id.did(), isChallengeValid: true }).keys.sendEmailBackup(
                    {
                        authToken: token,
                        providerType: 'firebase',
                        relayPayload: makeRelayPayload(),
                        confirmationCode: '123456',
                        email: recoveryEmail,
                    }
                )
            ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

            const stored = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: uid } },
            });

            expect(stored?.recoveryMethods).toEqual([]);
        } finally {
            relaySpy.mockRestore();
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });

    it('excludes pending methods from auth status and recovery-share responses', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `pending-hidden-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('9'.repeat(64));
        const collection = getUserKeysCollection();
        const caller = getClient({ did: learnCard.id.did(), isChallengeValid: true });

        await collection.insertOne(makeUserKey(email, uid, learnCard.id.did()));

        try {
            await caller.keys.addRecoveryMethod({
                authToken: token,
                providerType: 'firebase',
                type: 'backup',
                encryptedShare: { encryptedData: 'pending-share', iv: 'iv' },
                shareVersion: 1,
            });

            const status = await getClient().keys.getAuthShare({
                authToken: token,
                providerType: 'firebase',
            });
            const recovery = await getClient().keys.getRecoveryShare({
                authToken: token,
                providerType: 'firebase',
                type: 'backup',
            });

            expect(status?.recoveryMethods).toEqual([]);
            expect(recovery).toBeNull();
            await expect(
                caller.keys.activate({ authToken: token, providerType: 'firebase' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        } finally {
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });

    it('confirms a client-proved method and then permits activation', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `confirmed-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('7'.repeat(64));
        const collection = getUserKeysCollection();
        const caller = getClient({ did: learnCard.id.did(), isChallengeValid: true });

        await collection.insertOne(makeUserKey(email, uid, learnCard.id.did()));

        try {
            await caller.keys.addRecoveryMethod({
                authToken: token,
                providerType: 'firebase',
                type: 'phrase',
                shareVersion: 1,
            });
            await caller.keys.confirmRecoveryMethod({
                authToken: token,
                providerType: 'firebase',
                type: 'phrase',
            });
            await expect(
                caller.keys.activate({ authToken: token, providerType: 'firebase' })
            ).resolves.toEqual({ success: true });

            const stored = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: uid } },
            });

            expect(stored?.recoveryMethods[0]?.confirmationStatus).toBe('confirmed');
            expect(stored?.recoveryMethods[0]?.confirmedAt).toBeInstanceOf(Date);
            expect(stored?.sssActivationState).toBe('active');
        } finally {
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });

    it('grandfathers metadata-free methods only on already-active records', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const activeEmail = `legacy-active-${suffix}@example.com`;
        const provisionalEmail = `legacy-provisional-${suffix}@example.com`;
        const activeUid = `active-${suffix}`;
        const provisionalUid = `provisional-${suffix}`;
        const { learnCard } = await getUser('5'.repeat(64));
        const collection = getUserKeysCollection();
        const legacyMethod = { type: 'phrase' as const, createdAt: new Date(), shareVersion: 1 };
        const active = makeUserKey(activeEmail, activeUid, learnCard.id.did(), 'active');
        const provisional = makeUserKey(
            provisionalEmail,
            provisionalUid,
            learnCard.id.did(),
            'provisional'
        );

        active.recoveryMethods = [legacyMethod];
        provisional.recoveryMethods = [legacyMethod];
        await collection.insertMany([active, provisional]);

        try {
            const activeStatus = await getClient().keys.getAuthShare({
                authToken: makeMockToken(activeEmail, activeUid),
                providerType: 'firebase',
            });
            const provisionalStatus = await getClient().keys.getAuthShare({
                authToken: makeMockToken(provisionalEmail, provisionalUid),
                providerType: 'firebase',
            });

            expect(activeStatus?.recoveryMethods).toHaveLength(1);
            expect(provisionalStatus?.recoveryMethods).toEqual([]);
        } finally {
            await collection.deleteMany({
                'contactMethod.value': { $in: [activeEmail, provisionalEmail] },
            });
        }
    });

    it('hashes the email code, rejects a wrong code, and allows a correct retry', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `email-confirm-${suffix}@example.com`;
        const recoveryEmail = `personal-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('4'.repeat(64));
        const collection = getUserKeysCollection();
        const caller = getClient({ did: learnCard.id.did(), isChallengeValid: true });
        const relaySpy = mockRelayAcceptance();
        const code = '483920';

        await collection.insertOne(
            setVerifiedRecoveryEmail(makeUserKey(email, uid, learnCard.id.did()), recoveryEmail)
        );

        try {
            await caller.keys.sendEmailBackup({
                authToken: token,
                providerType: 'firebase',
                relayPayload: makeRelayPayload(),
                confirmationCode: code,
                email: recoveryEmail,
            });
            const relayCall = relaySpy.mock.calls.find(
                ([input]) => input === `${process.env.ESCROW_RELAY_URL}/email-backup`
            );
            const relayRequest = relayCall?.[1];

            expect(relayCall).toBeDefined();
            expect(relayRequest?.body).not.toContain('emailShare');
            expect(relayRequest?.body).not.toContain('0001-email-share');
            expect(relayRequest?.headers).toMatchObject({
                Authorization: 'Bearer relay-auth-token',
            });
            const pending = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: uid } },
            });

            expect(pending?.recoveryMethods[0]?.confirmationCodeHash).toBeTruthy();
            expect(pending?.recoveryMethods[0]?.confirmationCodeHash).not.toContain(code);
            await expect(
                caller.keys.confirmRecoveryMethod({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'email',
                    code: '000000' === code ? '000001' : '000000',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await expect(
                caller.keys.confirmRecoveryMethod({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'email',
                    code,
                })
            ).resolves.toEqual({ success: true });

            const confirmed = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: uid } },
            });

            expect(confirmed?.recoveryMethods[0]?.confirmedAt).toBeInstanceOf(Date);
            expect(confirmed?.recoveryMethods[0]?.confirmationCodeHash).toBeUndefined();
            expect(confirmed?.recoveryEmail).toBe(recoveryEmail);
        } finally {
            relaySpy.mockRestore();
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });

    it('rejects expired email codes and locks confirmation after five wrong attempts', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `email-limits-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('3'.repeat(64));
        const collection = getUserKeysCollection();
        const caller = getClient({ did: learnCard.id.did(), isChallengeValid: true });
        const relaySpy = mockRelayAcceptance();
        const expiredRecoveryEmail = `expired-${suffix}@example.com`;

        await collection.insertOne(
            setVerifiedRecoveryEmail(
                makeUserKey(email, uid, learnCard.id.did()),
                expiredRecoveryEmail
            )
        );

        try {
            await caller.keys.sendEmailBackup({
                authToken: token,
                providerType: 'firebase',
                relayPayload: makeRelayPayload(),
                confirmationCode: '135790',
                email: expiredRecoveryEmail,
            });
            const expiredCode = '135790';

            await collection.updateOne(
                { authProviders: { $elemMatch: { type: 'firebase', id: uid } } },
                { $set: { 'recoveryMethods.$[method].confirmationCodeExpiresAt': new Date(0) } },
                { arrayFilters: [{ 'method.type': 'email' }] }
            );
            await expect(
                caller.keys.confirmRecoveryMethod({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'email',
                    code: expiredCode,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const limitedRecoveryEmail = `limited-${suffix}@example.com`;

            await collection.updateOne(
                { authProviders: { $elemMatch: { type: 'firebase', id: uid } } },
                {
                    $set: {
                        recoveryEmail: limitedRecoveryEmail,
                        recoveryEmailVerifiedAt: new Date(),
                    },
                }
            );
            await caller.keys.sendEmailBackup({
                authToken: token,
                providerType: 'firebase',
                relayPayload: makeRelayPayload(),
                confirmationCode: '246802',
                email: limitedRecoveryEmail,
            });
            const validCode = '246802';
            const wrongCode = validCode === '111111' ? '222222' : '111111';

            for (let attempt = 0; attempt < 4; attempt++) {
                await expect(
                    caller.keys.confirmRecoveryMethod({
                        authToken: token,
                        providerType: 'firebase',
                        type: 'email',
                        code: wrongCode,
                    })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            }

            await expect(
                caller.keys.confirmRecoveryMethod({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'email',
                    code: wrongCode,
                })
            ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
            await expect(
                caller.keys.confirmRecoveryMethod({
                    authToken: token,
                    providerType: 'firebase',
                    type: 'email',
                    code: validCode,
                })
            ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        } finally {
            relaySpy.mockRestore();
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });
});
