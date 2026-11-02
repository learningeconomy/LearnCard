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
import { client } from '@mongo';
import { environment } from '@environment';
import { createRecoverySession, consumeRecoverySession } from '@cache/recoverySessions';
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
