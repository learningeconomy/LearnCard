import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import cache from '@cache';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
    splitPrivateKey,
    type EscrowEnvelope,
} from '@learncard/sss-key-manager';
import { Collection } from 'mongodb';
import { client } from '@mongo';
import { environment } from '@environment';
import {
    createRecoverySession,
    consumeRecoverySession,
    getRecoveryOtpSendCacheKey,
} from '@cache/recoverySessions';
import { encryptAuthShare } from '@helpers/shareEncryption.helpers';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    findUserKeyByAuthProvider,
    upsertUserKeyByAuthProvider,
    getEscrowHoldsCollection,
    findEscrowHoldById,
    type AuthProviderMapping,
    type MongoUserKeyType,
} from '@models';
import * as delivery from '../src/services/delivery';
import { __setEscrowEnclaveForTests } from '../src/services/escrow-enclave';
import { getClient, getUser } from './helpers/getClient';

const makeMockToken = (email: string, uid: string): string =>
    `header.${Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url')}.signature`;
const keyId = 'pin-sign-in-test';
const pk = '7'.repeat(64);
const pinProof = 'ab'.repeat(32);
const wrongProof = 'cd'.repeat(32);
const pinSalt = Buffer.alloc(16, 7).toString('base64');
const otherPinSalt = Buffer.alloc(16, 9).toString('base64');
let enclaveKeys: Awaited<ReturnType<typeof generateEscrowKeyPair>>;
let recipient: Awaited<ReturnType<typeof generateEscrowKeyPair>>;
let shares: Awaited<ReturnType<typeof splitPrivateKey>>;
let did: string;
let otherDid: string;
let authProvider: AuthProviderMapping;
let email: string;
let auth: { authToken: string; providerType: 'firebase' };

const owner = () => getClient({ did, isChallengeValid: true });
const newUidForRebind = () => `rebind-${randomUUID()}`;
const record = () => findUserKeyByAuthProvider(authProvider.type, authProvider.id);
/** The account by DID, for after a rebind replaced the owner's login. */
const accountByDid = () => getUserKeysCollection().findOne({ primaryDid: did });
const sealPin = (shareVersion: number): Promise<EscrowEnvelope> =>
    encryptEscrowBlob(
        { recoveryShare: shares.recoveryShare, did, shareVersion, pinVerifier: pinProof },
        enclaveKeys.publicKey,
        keyId
    );
const enrollPin = async (shareVersion = 1, salt = pinSalt) =>
    owner().escrow.enroll({
        ...auth,
        envelope: await sealPin(shareVersion),
        shareVersion,
        enclaveKeyId: keyId,
        pinSalt: salt,
    });
const startPin = () =>
    getClient().escrow.startRecovery({
        ...auth,
        clientEphemeralPublicKey: recipient.publicKey,
        releasePolicy: 'pin',
    });
const startHold = () =>
    getClient().escrow.startRecovery({ ...auth, clientEphemeralPublicKey: recipient.publicKey });
const resume = (hold: { holdId: string; resumeToken: string | null }) => {
    if (!hold.resumeToken) throw new Error('Expected a new recovery request');
    return { holdId: hold.holdId, resumeToken: hold.resumeToken };
};
const completePin = (hold: Parameters<typeof resume>[0], proof = pinProof) =>
    getClient().escrow.completeRecovery({ ...resume(hold), pinProof: proof });
const setDuration = (ms: number): void => {
    process.env.ESCROW_HOLD_DURATION_MS = String(ms);
    __setEscrowEnclaveForTests(undefined);
};
const captureEmails = () => {
    const send = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(delivery, 'getDeliveryService').mockReturnValue({ send });
    return () => send.mock.calls.map(call => (call[0] as { templateAlias: string }).templateAlias);
};
/** Everything keep mode must never touch. */
const securityState = (userKey: MongoUserKeyType | null) => ({
    authShare: userKey?.authShare,
    shareVersion: userKey?.shareVersion,
    previousAuthShares: userKey?.previousAuthShares,
    recoveryMethods: userKey?.recoveryMethods,
    escrowBlob: userKey?.escrowBlob,
    escrowPin: userKey?.escrowPin,
    sssActivationState: userKey?.sssActivationState,
    contactMethod: userKey?.contactMethod,
});

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    enclaveKeys = await generateEscrowKeyPair();
    recipient = await generateEscrowKeyPair();
    shares = await splitPrivateKey(pk);
    did = (await getUser(pk)).learnCard.id.did();
    otherDid = (await getUser('8'.repeat(64))).learnCard.id.did();
    process.env.ESCROW_ENCLAVE_MODE = 'software';
    process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
        [keyId]: enclaveKeys.privateKey,
    });
    process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID = keyId;
    setDuration(60_000);
    await client.connect();
    await createUserKeysIndexes();
});

beforeEach(async () => {
    const redis = cache.redis ?? cache.node;
    await redis.del('escrow:pin-complete:unknown');
    await redis.del('escrow:pin-start:unknown');
    setDuration(60_000);
    authProvider = { type: 'firebase', id: `pin-sign-in-${randomUUID()}` };
    email = `${authProvider.id}@example.com`;
    auth = { authToken: makeMockToken(email, authProvider.id), providerType: 'firebase' };
    await upsertUserKeyByAuthProvider({ type: 'email', value: email }, authProvider, {
        primaryDid: did,
        authShare: encryptAuthShare(
            { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
            environment.SEED
        ),
    });
});

afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await getUserKeysCollection().deleteMany({ primaryDid: { $in: [did, otherDid] } });
    await getEscrowHoldsCollection().deleteMany({ primaryDid: did });
});

afterAll(async () => {
    delete process.env.ESCROW_ENCLAVE_MODE;
    delete process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON;
    delete process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID;
    delete process.env.ESCROW_HOLD_DURATION_MS;
    __setEscrowEnclaveForTests(undefined);
    await client.close();
});

describe('PIN release sign-in notice and token origin', () => {
    it('tags the rebind token as a PIN release and sends only the PIN sign-in notice', async () => {
        await enrollPin();
        const hold = await startPin();
        const sentAliases = captureEmails();

        const released = await completePin(hold);

        expect(sentAliases()).toEqual(['escrow-pin-sign-in']);
        expect(await consumeRecoverySession(released.rebindSessionToken, 'rebind')).toMatchObject({
            authProvider,
            origin: 'pin-release',
            primaryDid: did,
            shareVersion: 1,
        });
        const kinds = (await findEscrowHoldById(hold.holdId))?.notifications.map(n => n.kind);
        expect(kinds).toContain('pin-sign-in');
        expect(kinds).not.toContain('completed');
    });

    it('never fails the release when the notice cannot be sent', async () => {
        await enrollPin();
        const hold = await startPin();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(delivery, 'getDeliveryService').mockReturnValue({
            send: vi.fn().mockRejectedValue(new Error('postmark down')),
        });

        const released = await completePin(hold);

        expect(
            (await openEscrowRelease(released.sealedShare, recipient.privateKey)).recoveryShare
        ).toBe(shares.recoveryShare);
    });

    it('keeps the waiting-period release untagged with the plain recovery notice', async () => {
        setDuration(1);
        await enrollPin();
        const started = await startHold();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(started.releaseAfter));
        const sentAliases = captureEmails();

        const released = await getClient().escrow.completeRecovery(resume(started));

        expect(sentAliases()).toEqual(['escrow-hold-released']);
        const session = await consumeRecoverySession(released.rebindSessionToken, 'rebind');
        expect(session).toMatchObject({ authProvider });
        expect(session?.origin).toBeUndefined();
    });
});

describe('keys.completePinSignIn (keep mode re-link)', () => {
    const newUid = () => `new-${randomUUID()}`;
    const pinRelease = async (): Promise<string> => {
        await enrollPin();
        return (await completePin(await startPin())).rebindSessionToken;
    };

    it('links the new login without touching shares, history, methods, escrow or contact', async () => {
        await owner().keys.storeAuthShare({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
        });
        await enrollPin(2);
        const token = (await completePin(await startPin())).rebindSessionToken;
        const before = await record();
        const uid = newUid();
        const sentAliases = captureEmails();

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
            })
        ).resolves.toEqual({ success: true, shareVersion: 2, linked: true });

        const after = await record();
        expect(before?.previousAuthShares).toHaveLength(1);
        expect(securityState(after)).toEqual(securityState(before));
        expect(after?.authProviders).toEqual([authProvider, { type: 'firebase', id: uid }]);
        // Same security notice as a rebind; fail-open, so let the void send settle.
        await vi.waitFor(() => expect(sentAliases()).toContain('account-sign-in-changed'));
        // The new login sees the same, still-confirmed account.
        const status = await getClient().keys.getAuthShare({
            authToken: makeMockToken(`${uid}@example.org`, uid),
            providerType: 'firebase',
        });
        expect(status?.shareVersion).toBe(2);
        expect(status?.escrowPin.enabled).toBe(true);
        expect(status?.recoveryMethods.map(method => method.type)).toContain('escrow');
    });

    it('reports linked:false and writes nothing when the login is already bound', async () => {
        const token = await pinRelease();
        const before = await record();

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: auth.authToken,
                providerType: 'firebase',
                primaryDid: did,
            })
        ).resolves.toEqual({ success: true, shareVersion: 1, linked: false });
        expect(await record()).toEqual(before);
    });

    it('is single-use', async () => {
        const token = await pinRelease();
        const input = {
            recoverySessionToken: token,
            newAuthToken: auth.authToken,
            providerType: 'firebase' as const,
            primaryDid: did,
        };

        await owner().keys.completePinSignIn(input);
        await expect(owner().keys.completePinSignIn(input)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('rejects waiting-period, recovery-session and recover-scope tokens', async () => {
        const uid = newUid();
        const input = (recoverySessionToken: string) => ({
            recoverySessionToken,
            newAuthToken: makeMockToken(`${uid}@example.org`, uid),
            providerType: 'firebase' as const,
            primaryDid: did,
        });
        const holdOrPhraseToken = await createRecoverySession({ scope: 'rebind', authProvider });
        const recoverToken = await createRecoverySession({ scope: 'recover', authProvider });
        const before = await record();

        await expect(
            owner().keys.completePinSignIn(input(holdOrPhraseToken))
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(owner().keys.completePinSignIn(input(recoverToken))).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(await record()).toEqual(before);
    });

    it('does not burn a token it rejects', async () => {
        const uid = newUid();
        const holdToken = await createRecoverySession({ scope: 'rebind', authProvider });

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: holdToken,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        // The waiting-period token still works where it belongs.
        await expect(
            owner().keys.completeRecoveryRebind({
                recoverySessionToken: holdToken,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
                authShare: { encryptedData: 'hold-split', encryptedDek: '', iv: '' },
            })
        ).resolves.toMatchObject({ success: true, shareVersion: 2 });

        // A wrong DID does not burn the owner's PIN token either.
        await getUserKeysCollection().deleteMany({ primaryDid: did });
        await upsertUserKeyByAuthProvider({ type: 'email', value: email }, authProvider, {
            primaryDid: did,
            authShare: encryptAuthShare(
                { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
                environment.SEED
            ),
        });
        const token = await pinRelease();
        await expect(
            getClient({ did: otherDid, isChallengeValid: true }).keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: auth.authToken,
                providerType: 'firebase',
                primaryDid: otherDid,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: auth.authToken,
                providerType: 'firebase',
                primaryDid: did,
            })
        ).resolves.toMatchObject({ success: true, linked: false });
    });

    it('rejects a DID that does not own the account or differs from the release', async () => {
        const token = await pinRelease();
        const uid = newUid();

        await expect(
            getClient({ did: otherDid, isChallengeValid: true }).keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: otherDid,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const forged = await createRecoverySession({
            scope: 'rebind',
            authProvider,
            origin: 'pin-release',
            primaryDid: otherDid,
            shareVersion: 1,
        });
        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: forged,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await record())?.authProviders).toEqual([authProvider]);
    });

    it('refuses a login that already belongs to another account', async () => {
        const token = await pinRelease();
        const takenUid = newUid();
        await upsertUserKeyByAuthProvider(
            { type: 'email', value: `${takenUid}@example.org` },
            { type: 'firebase', id: takenUid },
            {
                primaryDid: otherDid,
                authShare: { encryptedData: 'other-account', encryptedDek: '', iv: '' },
            }
        );

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: makeMockToken(`${takenUid}@example.org`, takenUid),
                providerType: 'firebase',
                primaryDid: did,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect((await record())?.authProviders).toEqual([authProvider]);
    });

    it('fails closed when the account rotated after the release (never undoes a revoke)', async () => {
        const token = await pinRelease();
        await owner().keys.revokeOtherDevices({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'revoked-split', encryptedDek: '', iv: '' },
            expectedShareVersion: 1,
        });
        const uid = newUid();

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect((await record())?.authProviders).toEqual([authProvider]);
    });
});

describe('keys.revokeOtherDevices (secure my account)', () => {
    it('unlinks a login added by a PIN sign-in, so it cannot sign in again', async () => {
        await enrollPin();
        const token = (await completePin(await startPin())).rebindSessionToken;
        const uid = `attacker-${randomUUID()}`;
        const attacker = {
            authToken: makeMockToken(`${uid}@example.org`, uid),
            providerType: 'firebase' as const,
        };
        await owner().keys.completePinSignIn({
            recoverySessionToken: token,
            newAuthToken: attacker.authToken,
            providerType: 'firebase',
            primaryDid: did,
        });
        expect((await record())?.authProviders).toHaveLength(2);

        await owner().keys.revokeOtherDevices({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'fresh-split', encryptedDek: '', iv: '' },
            expectedShareVersion: 1,
        });

        const after = await record();
        expect(after?.authProviders).toEqual([authProvider]);
        expect(after?.contactMethod).toEqual({ type: 'email', value: email });
        // The unlinked login no longer finds the account at all.
        expect((await getClient().keys.getAuthShare(attacker))?.authShare ?? null).toBeNull();
        await expect(
            getClient().escrow.startRecovery({
                ...attacker,
                clientEphemeralPublicKey: recipient.publicKey,
                releasePolicy: 'pin',
            })
        ).rejects.toBeTruthy();
    });

    it('a stale PIN-release token cannot wipe and rebind after the revoke', async () => {
        await enrollPin();
        // Keep mode never spends this token, so it is still live after the sign-in.
        const token = (await completePin(await startPin())).rebindSessionToken;
        await owner().keys.revokeOtherDevices({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'owner-split', encryptedDek: '', iv: '' },
            expectedShareVersion: 1,
        });
        const before = await record();
        const uid = `attacker-${randomUUID()}`;

        await expect(
            owner().keys.completeRecoveryRebind({
                recoverySessionToken: token,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
                authShare: { encryptedData: 'attacker-split', encryptedDek: '', iv: '' },
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await record()).toEqual(before);
    });

    it('a PIN-release token still rebinds at the released version (older clients)', async () => {
        await enrollPin();
        const token = (await completePin(await startPin())).rebindSessionToken;
        const uid = newUidForRebind();

        await expect(
            owner().keys.completeRecoveryRebind({
                recoverySessionToken: token,
                newAuthToken: makeMockToken(`${uid}@example.org`, uid),
                providerType: 'firebase',
                primaryDid: did,
                authShare: { encryptedData: 'rebind-split', encryptedDek: '', iv: '' },
            })
        ).resolves.toMatchObject({ success: true, shareVersion: 2 });
    });

    it('rotates, purges history, resets methods, clears escrow and cancels pending holds', async () => {
        await owner().keys.storeAuthShare({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
        });
        await enrollPin(2);
        const pending = await startHold();
        const before = await record();
        expect(before?.previousAuthShares).toHaveLength(1);

        await expect(
            owner().keys.revokeOtherDevices({
                ...auth,
                primaryDid: did,
                authShare: { encryptedData: 'fresh-split', encryptedDek: '', iv: '' },
                expectedShareVersion: 2,
            })
        ).resolves.toEqual({
            success: true,
            shareVersion: 3,
            recoveryMethodsRequireConfirmation: ['escrow'],
        });

        const after = await record();
        expect(after?.shareVersion).toBe(3);
        expect(after?.previousAuthShares).toEqual([]);
        expect(after?.escrowBlob).toBeUndefined();
        expect(after?.escrowPin).toBeUndefined();
        expect(after?.sssActivationState).toBe('provisional');
        expect(after?.recoveryMethods).toEqual([
            expect.objectContaining({
                type: 'escrow',
                shareVersion: 3,
                confirmationStatus: 'pending',
            }),
        ]);
        // The caller's login and the contact stay; only the split changes.
        expect(after?.authProviders).toEqual(before?.authProviders);
        expect(after?.contactMethod).toEqual(before?.contactMethod);
        expect((await findEscrowHoldById(pending.holdId))?.status).toBe('cancelled');

        const status = await owner().keys.getAuthShare(auth);
        expect(status?.authShare?.encryptedData).toBe('fresh-split');
        // An old device asking for its version gets nothing.
        expect(
            (await owner().keys.getAuthShare({ ...auth, shareVersion: 2 }))?.authShare
        ).toBeNull();
    });

    it('kills a PIN hold that was started before the revoke', async () => {
        await enrollPin();
        const hold = await startPin();

        await owner().keys.revokeOtherDevices({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'fresh-split', encryptedDek: '', iv: '' },
            expectedShareVersion: 1,
        });

        await expect(completePin(hold)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('returns CONFLICT and changes nothing for a stale expected version', async () => {
        const before = await record();

        await expect(
            owner().keys.revokeOtherDevices({
                ...auth,
                primaryDid: did,
                authShare: { encryptedData: 'fresh-split', encryptedDek: '', iv: '' },
                expectedShareVersion: 5,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await record()).toEqual(before);
    });

    it('only lets the account DID revoke', async () => {
        const before = await record();

        await expect(
            getClient({ did: otherDid, isChallengeValid: true }).keys.revokeOtherDevices({
                ...auth,
                primaryDid: otherDid,
                authShare: { encryptedData: 'fresh-split', encryptedDek: '', iv: '' },
                expectedShareVersion: 1,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(
            getClient({ did, isChallengeValid: false }).keys.revokeOtherDevices({
                ...auth,
                primaryDid: did,
                authShare: { encryptedData: 'fresh-split', encryptedDek: '', iv: '' },
                expectedShareVersion: 1,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(await record()).toEqual(before);
    });
});

describe('PIN status and carry after a keep-mode PIN re-set', () => {
    it('reports verified wrong entries made before a sign-in', async () => {
        await enrollPin();
        await expect(completePin(await startPin(), wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await expect(completePin(await startPin(), wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });

        expect((await owner().keys.getAuthShare(auth))?.escrowPin).toMatchObject({
            attemptsRemaining: 8,
            wrongAttempts: 2,
        });
    });

    const rotateAndReenrollWithoutPin = async () => {
        await owner().keys.storeAuthShare({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
        });
        return owner().escrow.enroll({
            ...auth,
            envelope: await encryptEscrowBlob(
                { recoveryShare: shares.recoveryShare, did, shareVersion: 2 },
                enclaveKeys.publicKey,
                keyId
            ),
            shareVersion: 2,
            enclaveKeyId: keyId,
        });
    };

    it('still retires a PIN whose release happened after it was set', async () => {
        await enrollPin();
        await completePin(await startPin());

        await rotateAndReenrollWithoutPin();

        expect((await record())?.escrowPin).toBeUndefined();
    });

    it('carries a PIN re-set at the same version after the release', async () => {
        await enrollPin();
        await completePin(await startPin());
        // Keep mode: same version, same PIN, fresh salt and budget, set after the release.
        await new Promise(resolve => setTimeout(resolve, 5));
        await enrollPin(1, otherPinSalt);
        expect((await record())?.escrowPin).toMatchObject({ failedAttempts: 0, shareVersion: 1 });

        await rotateAndReenrollWithoutPin();

        expect((await record())?.escrowPin).toMatchObject({
            salt: otherPinSalt,
            shareVersion: 2,
            failedAttempts: 0,
        });
    });
});

describe('same-PIN budget refresh with expected charges', () => {
    const refresh = async (expectedPinCharges: {
        attemptsRemaining: number;
        wrongAttempts: number;
    }) =>
        owner().escrow.enroll({
            ...auth,
            envelope: await sealPin(1),
            shareVersion: 1,
            enclaveKeyId: keyId,
            pinSalt: otherPinSalt,
            expectedPinCharges,
        });
    const pinStatus = async () => (await owner().keys.getAuthShare(auth))?.escrowPin;

    it('refreshes the budget when only the owner release was charged', async () => {
        await enrollPin();
        await completePin(await startPin());
        expect(await pinStatus()).toMatchObject({ attemptsRemaining: 9, wrongAttempts: 0 });

        await refresh({ attemptsRemaining: 9, wrongAttempts: 0 });

        expect((await record())?.escrowPin).toMatchObject({
            salt: otherPinSalt,
            failedAttempts: 0,
        });
    });

    it('refuses the refresh, changing nothing, when another reservation landed after the check', async () => {
        await enrollPin();
        await completePin(await startPin());
        // Someone else's guess is reserved (charged) but not yet resolved.
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $inc: { 'escrowPin.failedAttempts': 1 } }
        );
        const before = await record();

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });

        expect(securityState(await record())).toEqual(securityState(before));
    });

    it('refuses the refresh when a wrong entry was recorded since the check', async () => {
        await enrollPin();
        await completePin(await startPin());
        await expect(completePin(await startPin(), wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        const before = await record();

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });

        expect(securityState(await record())).toEqual(securityState(before));
    });

    it("refreshes when the expected charges include the owner's own wrong entry (own-typos rule)", async () => {
        await enrollPin();
        // The owner mistypes once in this sign-in, then releases with the right PIN.
        await expect(completePin(await startPin(), wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await completePin(await startPin());
        expect(await pinStatus()).toMatchObject({ attemptsRemaining: 8, wrongAttempts: 1 });

        await refresh({ attemptsRemaining: 8, wrongAttempts: 1 });

        expect((await record())?.escrowPin).toMatchObject({
            salt: otherPinSalt,
            failedAttempts: 0,
        });
    });

    it('refuses a refresh whose wrong entries do not match the record, or exceed the charges', async () => {
        await enrollPin();
        await expect(completePin(await startPin(), wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await completePin(await startPin());
        const before = await record();

        // A foreign wrong entry the client did not count.
        await expect(refresh({ attemptsRemaining: 8, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await expect(refresh({ attemptsRemaining: 8, wrongAttempts: 3 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });

        expect(securityState(await record())).toEqual(securityState(before));
    });

    it('enforces the charges in the write itself (a reservation between read and write)', async () => {
        await enrollPin();
        await completePin(await startPin());
        const before = await record();
        // Land a reservation after the route's reads, just before its conditional write.
        const realFindOneAndUpdate = Collection.prototype.findOneAndUpdate;
        let raced = false;
        vi.spyOn(Collection.prototype, 'findOneAndUpdate').mockImplementation(async function (
            this: Collection,
            ...args: unknown[]
        ) {
            if (!raced) {
                raced = true;
                await getUserKeysCollection().updateOne(
                    { primaryDid: did },
                    { $inc: { 'escrowPin.failedAttempts': 1 } }
                );
            }
            return (realFindOneAndUpdate as (...a: unknown[]) => unknown).apply(this, args);
        } as never);

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });

        expect(raced).toBe(true);
        const after = await record();
        expect(after?.escrowPin).toMatchObject({
            salt: pinSalt,
            failedAttempts: (before?.escrowPin?.failedAttempts ?? 0) + 1,
        });
        expect(after?.escrowBlob).toEqual(before?.escrowBlob);
    });

    it('rejects expected charges without a new PIN', async () => {
        await enrollPin();
        await expect(
            owner().escrow.enroll({
                ...auth,
                envelope: await sealPin(1),
                shareVersion: 1,
                enclaveKeyId: keyId,
                clearPin: true,
                expectedPinCharges: { attemptsRemaining: 10, wrongAttempts: 0 },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
});

describe('security epoch: every recovery token dies at a revoke or wiping rebind', () => {
    const newLogin = () => {
        const uid = `fresh-${randomUUID()}`;
        return { uid, authToken: makeMockToken(`${uid}@example.org`, uid) };
    };
    const revoke = (expectedShareVersion = 1) =>
        owner().keys.revokeOtherDevices({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'owner-split', encryptedDek: '', iv: '' },
            expectedShareVersion,
        });
    const rebind = (recoverySessionToken: string, authToken = newLogin().authToken) =>
        owner().keys.completeRecoveryRebind({
            recoverySessionToken,
            newAuthToken: authToken,
            providerType: 'firebase',
            primaryDid: did,
            authShare: { encryptedData: 'attacker-split', encryptedDek: '', iv: '' },
        });
    /** A confirmed phrase method and verified recovery email, so the real OTP flow works. */
    const addPhraseRecovery = async (): Promise<string> => {
        const recoveryEmail = `recover-${randomUUID()}@example.com`;
        const now = new Date();
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            {
                $set: { recoveryEmail, recoveryEmailVerifiedAt: now },
                $push: {
                    recoveryMethods: {
                        type: 'phrase',
                        createdAt: now,
                        confirmationStatus: 'confirmed',
                        confirmedAt: now,
                        shareVersion: 1,
                    },
                },
            }
        );
        return recoveryEmail;
    };
    /** The real lost-login OTP flow up to the `recover`-scope session token. */
    const verifiedRecoverySession = async (recoveryEmail: string): Promise<string> => {
        const send = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(delivery, 'getDeliveryService').mockReturnValue({ send });
        // Skip the per-address resend cooldown between sessions in one test.
        await (cache.redis ?? cache.node).del(getRecoveryOtpSendCacheKey(recoveryEmail));
        await getClient().keys.startRecoverySession({ email: recoveryEmail });
        const code = (send.mock.calls[0]?.[0] as { templateModel?: { verificationCode?: string } })
            ?.templateModel?.verificationCode;
        if (!code) throw new Error('Recovery OTP was not delivered in the test');
        vi.restoreAllMocks();
        return (await getClient().keys.verifyRecoverySession({ email: recoveryEmail, code }))
            .recoverySessionToken;
    };
    const phraseRebindToken = async (recoveryEmail: string): Promise<string> =>
        (
            await getClient().keys.useRecoverySession({
                recoverySessionToken: await verifiedRecoverySession(recoveryEmail),
                type: 'phrase',
            })
        ).rebindSessionToken;

    it('records the epoch on every minted token (recover, phrase, hold, PIN)', async () => {
        const recoveryEmail = await addPhraseRecovery();
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { securityEpoch: 4 } }
        );

        const recoverToken = await verifiedRecoverySession(recoveryEmail);
        expect((await consumeRecoverySession(recoverToken, 'recover'))?.securityEpoch).toBe(4);
        const phraseToken = await phraseRebindToken(recoveryEmail);
        expect((await consumeRecoverySession(phraseToken, 'rebind'))?.securityEpoch).toBe(4);
        await enrollPin();
        const pinToken = (await completePin(await startPin())).rebindSessionToken;
        expect((await consumeRecoverySession(pinToken, 'rebind'))?.securityEpoch).toBe(4);
    });

    it('rejects a pre-revoke phrase token at /rebind, even with a fresh unrelated login', async () => {
        const recoveryEmail = await addPhraseRecovery();
        // The attacker recovered the DID key with the phrase and holds the rebind token.
        const token = await phraseRebindToken(recoveryEmail);
        await revoke();
        const before = await record();

        await expect(rebind(token)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await record()).toEqual(before);
        expect(before?.authProviders).toEqual([authProvider]);
        expect(before?.securityEpoch).toBe(1);
    });

    it('rejects a pre-revoke passkey/backup-shaped token (any non-PIN origin)', async () => {
        // `useRecoverySession` mints the same record for phrase, passkey and backup.
        const token = await createRecoverySession({
            scope: 'rebind',
            authProvider,
            securityEpoch: 0,
        });
        await revoke();
        const before = await record();

        await expect(rebind(token)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await record()).toEqual(before);
    });

    it('rejects a pre-revoke waiting-period hold token', async () => {
        setDuration(1);
        await enrollPin();
        const started = await startHold();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(started.releaseAfter));
        const { rebindSessionToken } = await getClient().escrow.completeRecovery(resume(started));
        vi.useRealTimers();
        await revoke();
        const before = await record();

        await expect(rebind(rebindSessionToken)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await record()).toEqual(before);
    });

    it('rejects a pre-revoke recover-scope session at release and at escrow start', async () => {
        const recoveryEmail = await addPhraseRecovery();
        const forRelease = await verifiedRecoverySession(recoveryEmail);
        const forEscrow = await verifiedRecoverySession(recoveryEmail);
        await revoke();
        // The owner re-enrolls on the new split, so only the epoch can stop the stale session.
        await enrollPin(2);

        await expect(
            getClient().keys.useRecoverySession({
                recoverySessionToken: forRelease,
                type: 'phrase',
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(
            getClient().escrow.startRecovery({
                recoverySessionToken: forEscrow,
                clientEphemeralPublicKey: recipient.publicKey,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('a wiping rebind retires older tokens for logins it kept', async () => {
        // Two logins; tokens for both minted at epoch 0.
        const second: AuthProviderMapping = { type: 'firebase', id: `second-${randomUUID()}` };
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $push: { authProviders: second } }
        );
        const first = await createRecoverySession({
            scope: 'rebind',
            authProvider,
            securityEpoch: 0,
        });
        const stale = await createRecoverySession({
            scope: 'rebind',
            authProvider: second,
            securityEpoch: 0,
        });

        await expect(rebind(first)).resolves.toMatchObject({ success: true, shareVersion: 2 });
        const before = await accountByDid();
        expect(before?.securityEpoch).toBe(1);
        expect(before?.authProviders).toContainEqual(second);

        await expect(rebind(stale)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await accountByDid()).toEqual(before);
    });

    it('enforces the epoch in the write itself (revoke between read and write)', async () => {
        const token = await createRecoverySession({
            scope: 'rebind',
            authProvider,
            securityEpoch: 0,
        });
        // Land a wiping event after the route's reads, just before its conditional write.
        const realFindOneAndUpdate = Collection.prototype.findOneAndUpdate;
        let raced = false;
        vi.spyOn(Collection.prototype, 'findOneAndUpdate').mockImplementation(async function (
            this: Collection,
            ...args: unknown[]
        ) {
            if (!raced) {
                raced = true;
                await getUserKeysCollection().updateOne(
                    { primaryDid: did },
                    { $inc: { securityEpoch: 1 } }
                );
            }
            return (realFindOneAndUpdate as (...a: unknown[]) => unknown).apply(this, args);
        } as never);

        await expect(rebind(token)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(raced).toBe(true);
        expect((await record())?.authProviders).toEqual([authProvider]);
        expect((await record())?.shareVersion).toBe(1);
    });

    it('ordinary rotations do not break an in-flight recovery', async () => {
        const recoveryEmail = await addPhraseRecovery();
        const token = await phraseRebindToken(recoveryEmail);
        // Another of the owner's devices rotates (non-wiping): the token still works.
        await owner().keys.storeAuthShare({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'rotated', encryptedDek: '', iv: '' },
        });
        expect((await record())?.securityEpoch).toBeUndefined();

        await expect(rebind(token)).resolves.toMatchObject({ success: true, shareVersion: 3 });
        expect((await accountByDid())?.securityEpoch).toBe(1);
    });

    it('legacy accounts and tokens without the field still work', async () => {
        expect((await record())?.securityEpoch).toBeUndefined();
        const token = await createRecoverySession({ scope: 'rebind', authProvider });

        await expect(rebind(token)).resolves.toMatchObject({ success: true, shareVersion: 2 });
    });

    it('a PIN sign-in minted after a revoke works at the new epoch', async () => {
        await revoke();
        await enrollPin(2);
        const token = (await completePin(await startPin())).rebindSessionToken;
        const login = newLogin();

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: login.authToken,
                providerType: 'firebase',
                primaryDid: did,
            })
        ).resolves.toEqual({ success: true, shareVersion: 2, linked: true });
    });

    it('a stale PIN token cannot re-link even when the share version matches', async () => {
        await enrollPin();
        const token = (await completePin(await startPin())).rebindSessionToken;
        // Simulate a wiping event that left the version where it was.
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $inc: { securityEpoch: 1 } }
        );

        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: token,
                newAuthToken: newLogin().authToken,
                providerType: 'firebase',
                primaryDid: did,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(
            owner().keys.completePinSignIn({
                recoverySessionToken: (await completePin(await startPin())).rebindSessionToken,
                newAuthToken: auth.authToken,
                providerType: 'firebase',
                primaryDid: did,
            })
        ).resolves.toMatchObject({ linked: false });
        expect((await record())?.authProviders).toEqual([authProvider]);
    });
});

describe('revokeOtherDevices notice (account-secured)', () => {
    const captureSends = () => {
        const send = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(delivery, 'getDeliveryService').mockReturnValue({ send });
        return () =>
            send.mock.calls
                .map(
                    call => call[0] as { to: string; templateAlias: string; templateModel: object }
                )
                .filter(call => call.templateAlias === 'account-secured');
    };
    const revoke = () =>
        owner().keys.revokeOtherDevices({
            ...auth,
            primaryDid: did,
            authShare: { encryptedData: 'owner-split', encryptedDek: '', iv: '' },
            expectedShareVersion: 1,
        });

    it('emails the contact and the verified recovery address, deduped', async () => {
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            {
                $set: {
                    recoveryEmail: 'owner-recovery@example.com',
                    recoveryEmailVerifiedAt: new Date(),
                },
            }
        );
        const sends = captureSends();

        await revoke();

        expect(
            sends()
                .map(call => call.to)
                .sort()
        ).toEqual([email, 'owner-recovery@example.com'].sort());
        expect(sends()[0]?.templateModel).toEqual({ securedAt: expect.any(String) });
    });

    it('sends one notice when the recovery email repeats the contact address', async () => {
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { recoveryEmail: email.toUpperCase(), recoveryEmailVerifiedAt: new Date() } }
        );
        const sends = captureSends();

        await revoke();

        expect(sends().map(call => call.to)).toEqual([email]);
    });

    it('skips an unverified recovery email', async () => {
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { recoveryEmail: 'unverified@example.com' } }
        );
        const sends = captureSends();

        await revoke();

        expect(sends().map(call => call.to)).toEqual([email]);
    });

    it('notifies the owner when someone else ran it from a PIN-signed-in login', async () => {
        await enrollPin();
        const token = (await completePin(await startPin())).rebindSessionToken;
        const uid = `attacker-${randomUUID()}`;
        const attacker = {
            authToken: makeMockToken(`${uid}@example.org`, uid),
            providerType: 'firebase' as const,
        };
        await owner().keys.completePinSignIn({
            recoverySessionToken: token,
            newAuthToken: attacker.authToken,
            providerType: 'firebase',
            primaryDid: did,
        });
        const sends = captureSends();

        await owner().keys.revokeOtherDevices({
            ...attacker,
            primaryDid: did,
            authShare: { encryptedData: 'attacker-split', encryptedDek: '', iv: '' },
            expectedShareVersion: 1,
        });

        // The owner's login is gone, but the owner's address still gets the notice.
        expect(await record()).toBeNull();
        expect(sends().map(call => call.to)).toEqual([email]);
    });

    it('never fails the committed revoke when the notice cannot be sent', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(delivery, 'getDeliveryService').mockReturnValue({
            send: vi.fn().mockRejectedValue(new Error('postmark down')),
        });

        await expect(revoke()).resolves.toMatchObject({ success: true, shareVersion: 2 });
        expect((await record())?.shareVersion).toBe(2);
    });
});
