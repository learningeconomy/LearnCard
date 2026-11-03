import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { Collection } from 'mongodb';
import cache from '@cache';
import {
    decryptEscrowBlob,
    encryptEscrowBlob,
    generateEscrowKeyPair,
    getEscrowBlobIdentity,
    signEscrowEnrollmentIntent,
    splitPrivateKey,
    type EscrowEnvelope,
} from '@learncard/sss-key-manager';
import { client } from '@mongo';
import { environment } from '@environment';
import { encryptAuthShare } from '@helpers/shareEncryption.helpers';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    findUserKeyByAuthProvider,
    upsertUserKeyByAuthProvider,
    getEscrowHoldsCollection,
    claimEscrowEnrollmentLease,
    ESCROW_ENROLLMENT_LEASE_TTL_MS,
    ESCROW_PIN_COMPARE_TTL_MS,
    type AuthProviderMapping,
    type EscrowEnrollmentLease,
} from '@models';
import {
    __setEscrowEnclaveForTests,
    __resetEscrowAttestationCacheForTests,
    getEscrowEnclave,
    EscrowPinMismatchError,
    EscrowPolicyError,
    EscrowUnavailableError,
    type EnclaveAttestation,
    type EscrowEnclave,
} from '../src/services/escrow-enclave';
import type {
    AuthorityMutationResult,
    AuthorityStateResponse,
} from '../src/services/escrow-enclave/authorityContract';
import type { ApplyEnrollmentInput } from '../src/services/escrow-enclave/types';
import { runEscrowBlobRewrap } from '../src/jobs/escrowBlobRewrap';
import { getClient, getUser } from './helpers/getClient';

/**
 * The per-account PIN-operation lease (authority mode). The fake authority below
 * models services/escrow-enclave-app/src/policy/authority.rs: `apply_enrollment_intent`
 * checks only the expected ENROLLMENT version, so a PIN compare (which advances the
 * OPERATION revision and `attempts_used`) never makes it refuse; `Set`/`Change`/`Clear`
 * start a new PIN generation with `attempts_used: 0`; holds and releases against any
 * envelope but the committed one are refused.
 */

const makeMockToken = (email: string, uid: string): string =>
    `header.${Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url')}.signature`;
const keyId = 'pin-lease-test';
const pk = '6'.repeat(64);
const pinProof = 'ab'.repeat(32);
const wrongProof = 'cd'.repeat(32);
const pinSalt = Buffer.alloc(16, 7).toString('base64');
const refreshSalt = Buffer.alloc(16, 9).toString('base64');
const receipt = {
    version: 1 as const,
    kind: 'commit' as const,
    keyId,
    measurement: Array.from({ length: 32 }, () => 0),
    payload: 'AQ==',
    signature: Buffer.alloc(64).toString('base64'),
};
let enclaveKeys: Awaited<ReturnType<typeof generateEscrowKeyPair>>;
let recipient: Awaited<ReturnType<typeof generateEscrowKeyPair>>;
let shares: Awaited<ReturnType<typeof splitPrivateKey>>;
let did: string;
let authProvider: AuthProviderMapping;
let auth: { authToken: string; providerType: 'firebase' };

const owner = () => getClient({ did, isChallengeValid: true });
const record = () => findUserKeyByAuthProvider(authProvider.type, authProvider.id);
const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(r => {
        resolve = r;
    });
    return { promise, resolve };
};

interface AuthorityModel {
    enrollmentVersion: number;
    operationRevision: number;
    enrollmentEpoch: number;
    pinGeneration: number;
    hasPin: boolean;
    attemptsUsed: number;
    envelope: EscrowEnvelope | null;
    shareVersion: number | null;
}

let authority: AuthorityModel;
/** Test hooks, run inside the fake authority's calls. */
let hooks: {
    onState?: () => Promise<void>;
    beforeApply?: () => Promise<void>;
    afterCommit?: () => Promise<void>;
    beforeRelease?: (pinProof: string | undefined) => Promise<void>;
    afterRewrap?: () => Promise<void>;
};
let applyCalls: number;
let releaseCalls: number;
let stateFailures: number;

const identity = async (envelope: EscrowEnvelope | null | undefined) =>
    envelope ? getEscrowBlobIdentity(envelope) : null;

const installAuthority = async (): Promise<void> => {
    process.env.ESCROW_ENCLAVE_MODE = 'software';
    __setEscrowEnclaveForTests(undefined);
    const software = getEscrowEnclave();
    const attestation = await software.getAttestation();
    const createHold = software.createHold.bind(software);
    const releaseEscrow = software.releaseEscrow.bind(software);
    const assertCurrentCopy = async (envelope: EscrowEnvelope) => {
        if ((await identity(envelope)) !== (await identity(authority.envelope)))
            throw new EscrowPolicyError();
    };
    const state = async (input: { expectedDid: string }): Promise<AuthorityStateResponse> => {
        await hooks.onState?.();
        if (stateFailures > 0) {
            stateFailures -= 1;
            throw new EscrowUnavailableError('transport');
        }
        return {
            state: {
                tenant: 'learncard',
                authorityGeneration: 'g1',
                did: input.expectedDid,
                status: authority.envelope ? 'active' : 'empty',
                enrollmentVersion: authority.enrollmentVersion,
                enrollmentEpoch: authority.enrollmentEpoch,
                envelope: authority.envelope,
                shareVersion: authority.shareVersion,
                hasPin: authority.hasPin,
                pinGeneration: authority.pinGeneration,
                attemptsUsed: authority.attemptsUsed,
            },
            proof: { ...receipt, kind: 'snapshot' },
        };
    };
    const apply = async (input: ApplyEnrollmentInput): Promise<AuthorityMutationResult> => {
        applyCalls += 1;
        await hooks.beforeApply?.();
        const intent = input.signedIntent.intent;
        // Rust: only the enrollment version is compared, never the operation revision.
        if (intent.expectedEnrollmentVersion !== authority.enrollmentVersion)
            throw new EscrowPolicyError();
        if ((await identity(input.sourceEnvelope)) !== (await identity(authority.envelope)))
            throw new EscrowPolicyError();
        const plaintext = await decryptEscrowBlob(input.targetEnvelope!, enclaveKeys.privateKey);
        // The authority re-seals: the committed identity is never the submitted target's.
        const envelope = await encryptEscrowBlob(plaintext, enclaveKeys.publicKey, keyId);
        if (intent.pinAction !== 'keep') {
            authority.pinGeneration += 1;
            authority.hasPin = intent.pinAction !== 'clear';
            authority.attemptsUsed = 0;
        }
        authority.enrollmentVersion += 1;
        authority.operationRevision += 1;
        authority.enrollmentEpoch = intent.enrollmentEpoch;
        authority.envelope = envelope;
        authority.shareVersion = intent.shareVersion;
        await hooks.afterCommit?.();
        return {
            envelope,
            receipt,
            authorityGeneration: 'g1',
            enrollmentVersion: authority.enrollmentVersion,
            enrollmentEpoch: authority.enrollmentEpoch,
        };
    };
    process.env.ESCROW_ENCLAVE_MODE = 'remote';
    process.env.ESCROW_ENCLAVE_REMOTE_URL = 'https://escrow.invalid';
    process.env.ESCROW_ENCLAVE_REMOTE_TOKEN = 't'.repeat(32);
    __setEscrowEnclaveForTests(
        Object.assign(software, {
            getAttestation: async (): Promise<EnclaveAttestation> => ({
                ...attestation,
                mode: 'nitro',
            }),
            getEnrollmentState: state,
            applyEnrollmentIntent: apply,
            createHold: async (input: Parameters<EscrowEnclave['createHold']>[0]) => {
                await assertCurrentCopy(input.envelope);
                return createHold(input);
            },
            releaseEscrow: async (input: Parameters<EscrowEnclave['releaseEscrow']>[0]) => {
                releaseCalls += 1;
                await hooks.beforeRelease?.(input.pinProof);
                await assertCurrentCopy(input.envelope);
                authority.operationRevision += 1;
                authority.attemptsUsed += 1;
                try {
                    return await releaseEscrow(input);
                } catch (error) {
                    if (!(error instanceof EscrowPinMismatchError)) authority.attemptsUsed -= 1;
                    throw error;
                }
            },
        }) as EscrowEnclave
    );
};

const sealPin = (shareVersion = 1): Promise<EscrowEnvelope> =>
    encryptEscrowBlob(
        {
            recoveryShare: shares.recoveryShare,
            did,
            shareVersion,
            pinVerifier: pinProof,
            recoveryEmail: 'owner@example.com',
            recoveryLanguage: 'en',
        },
        enclaveKeys.publicKey,
        keyId
    );

const signedIntent = async (
    target: EscrowEnvelope,
    options: { action: 'enroll' | 'replace'; pinAction: 'set' | 'change' }
) =>
    signEscrowEnrollmentIntent(
        {
            version: 2,
            tenant: 'learncard',
            did,
            authorityGeneration: 'g1',
            expectedEnrollmentVersion: authority.enrollmentVersion,
            action: options.action,
            sourceBlobIdentity: await identity(authority.envelope),
            targetBlobIdentity: await getEscrowBlobIdentity(target),
            pinAction: options.pinAction,
            shareVersion: 1,
            enrollmentEpoch: authority.enrollmentEpoch + 1,
            requestId: randomUUID(),
            allowRewrap: true,
            recoveryEmail: 'owner@example.com',
            recoveryLanguage: 'en',
        },
        pk
    );

/** Owner-signed PIN set at version 1 (the initial enrollment). */
const enrollPin = async () => {
    const envelope = await sealPin();
    return owner().escrow.enroll({
        ...auth,
        envelope,
        shareVersion: 1,
        enclaveKeyId: keyId,
        pinSalt,
        signedIntent: await signedIntent(envelope, { action: 'enroll', pinAction: 'set' }),
        sourceEnvelope: null,
    });
};

/** The keep-mode same-PIN refresh (owner-signed `change`, new salt, expected charges). */
const refresh = async (expectedPinCharges: {
    attemptsRemaining: number;
    wrongAttempts: number;
}) => {
    const envelope = await sealPin();
    return owner().escrow.enroll({
        ...auth,
        envelope,
        shareVersion: 1,
        enclaveKeyId: keyId,
        pinSalt: refreshSalt,
        signedIntent: await signedIntent(envelope, { action: 'replace', pinAction: 'change' }),
        sourceEnvelope: authority.envelope,
        expectedPinCharges,
    });
};

const startPin = () =>
    getClient().escrow.startRecovery({
        ...auth,
        clientEphemeralPublicKey: recipient.publicKey,
        releasePolicy: 'pin',
    });
const completePin = (hold: { holdId: string; resumeToken: string | null }, proof = pinProof) =>
    getClient().escrow.completeRecovery({
        holdId: hold.holdId,
        resumeToken: hold.resumeToken!,
        pinProof: proof,
    });

/** Mongo serves the authority's committed copy. */
const expectConsistent = async () => {
    const stored = await record();
    expect(stored?.escrowBlob?.blobHash).toBe(await identity(authority.envelope));
    expect(stored?.escrowBlob?.enrollmentVersion).toBe(authority.enrollmentVersion);
};

/** Enroll a PIN and spend one attempt on the owner's own successful release. */
const signedInWithPin = async () => {
    await enrollPin();
    await completePin(await startPin());
    expect(authority.attemptsUsed).toBe(1);
    expect((await record())?.escrowPin).toMatchObject({
        failedAttempts: 1,
        verifiedFailedAttempts: 0,
    });
    applyCalls = 0;
    releaseCalls = 0;
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    enclaveKeys = await generateEscrowKeyPair();
    recipient = await generateEscrowKeyPair();
    shares = await splitPrivateKey(pk);
    did = (await getUser(pk)).learnCard.id.did();
    process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
        [keyId]: enclaveKeys.privateKey,
    });
    process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID = keyId;
    process.env.ESCROW_HOLD_DURATION_MS = '60000';
    await client.connect();
    await createUserKeysIndexes();
});

beforeEach(async () => {
    const redis = cache.redis ?? cache.node;
    await redis.del('escrow:pin-complete:unknown');
    await redis.del('escrow:pin-start:unknown');
    authority = {
        enrollmentVersion: 0,
        operationRevision: 0,
        enrollmentEpoch: 0,
        pinGeneration: 0,
        hasPin: false,
        attemptsUsed: 0,
        envelope: null,
        shareVersion: null,
    };
    hooks = {};
    applyCalls = 0;
    releaseCalls = 0;
    stateFailures = 0;
    await installAuthority();
    authProvider = { type: 'firebase', id: `pin-lease-${randomUUID()}` };
    const email = `${authProvider.id}@example.com`;
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
    await getUserKeysCollection().deleteMany({ primaryDid: did });
    await getEscrowHoldsCollection().deleteMany({ primaryDid: did });
});

afterAll(async () => {
    delete process.env.ESCROW_ENCLAVE_MODE;
    delete process.env.ESCROW_ENCLAVE_REMOTE_URL;
    delete process.env.ESCROW_ENCLAVE_REMOTE_TOKEN;
    delete process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON;
    delete process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID;
    delete process.env.ESCROW_HOLD_DURATION_MS;
    __setEscrowEnclaveForTests(undefined);
    await client.close();
});

describe('same-PIN refresh vs. a concurrent wrong PIN (authority mode)', () => {
    it('refuses the refresh before the authority when a wrong PIN completes between the charge read and the authority call', async () => {
        await signedInWithPin();
        const attacker = await startPin();
        // The route has read and validated the charges; its authority-state read is next.
        hooks.onState = async () => {
            hooks.onState = undefined;
            await expect(completePin(attacker, wrongProof)).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        };

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });

        // Nothing reached the authority, so both copies agree and the guess stays charged.
        expect(applyCalls).toBe(0);
        expect(authority.attemptsUsed).toBe(2);
        await expectConsistent();
        expect((await record())?.escrowPin).toMatchObject({
            salt: pinSalt,
            failedAttempts: 2,
            verifiedFailedAttempts: 1,
        });
        expect((await record())?.escrowEnrollmentLease).toBeUndefined();
        // The PIN still works with its reduced budget.
        await completePin(await startPin());
    });

    it('refuses the refresh while a compare reserved before the check is still at the authority', async () => {
        await signedInWithPin();
        const attacker = await startPin();
        const atAuthority = deferred();
        const proceed = deferred();
        hooks.beforeRelease = async () => {
            hooks.beforeRelease = undefined;
            atAuthority.resolve();
            await proceed.promise;
        };
        const guess = completePin(attacker, wrongProof).catch(error => error);
        await atAuthority.promise;
        // The client's status read includes the in-flight reservation as a charge.
        expect((await record())?.escrowPinCompares).toHaveLength(1);

        await expect(refresh({ attemptsRemaining: 8, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(applyCalls).toBe(0);

        proceed.resolve();
        expect(await guess).toMatchObject({ code: 'FORBIDDEN' });
        await expectConsistent();
        const stored = await record();
        expect(stored?.escrowPin).toMatchObject({ failedAttempts: 2, verifiedFailedAttempts: 1 });
        expect(stored?.escrowPinCompares).toEqual([]);
    });

    it('refuses PIN compares while the lease is held, then commits both copies together', async () => {
        await signedInWithPin();
        const pending = await startPin();
        const atAuthority = deferred();
        const proceed = deferred();
        hooks.beforeApply = async () => {
            atAuthority.resolve();
            await proceed.promise;
        };
        const refreshed = refresh({ attemptsRemaining: 9, wrongAttempts: 0 });
        await atAuthority.promise;
        const releasesBefore = releaseCalls;

        // Retryable, nothing charged, nothing sent to the authority.
        await expect(completePin(pending, wrongProof)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: 'Automatic recovery is being updated. Please try again in a moment.',
        });
        expect(releaseCalls).toBe(releasesBefore);
        expect((await record())?.escrowPin).toMatchObject({ failedAttempts: 1 });

        proceed.resolve();
        await refreshed;
        await expectConsistent();
        const stored = await record();
        expect(stored?.escrowPin).toMatchObject({ salt: refreshSalt, failedAttempts: 0 });
        expect(stored?.escrowEnrollmentLease).toBeUndefined();
        expect(authority.attemptsUsed).toBe(0);
    });
});

describe('reconciling an authority commit lca-api did not persist', () => {
    it('adopts the commit when the response is lost after the authority committed', async () => {
        await signedInWithPin();
        hooks.afterCommit = async () => {
            hooks.afterCommit = undefined;
            throw new EscrowUnavailableError('transport');
        };

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });

        await expectConsistent();
        const stored = await record();
        expect(stored?.escrowPin).toMatchObject({ salt: refreshSalt, failedAttempts: 0 });
        expect(stored?.escrowEnrollmentLease).toBeUndefined();
        await completePin(await startPin());
    });

    it('adopts the commit when its own write misses because the lease was lost', async () => {
        await signedInWithPin();
        hooks.afterCommit = async () => {
            hooks.afterCommit = undefined;
            await getUserKeysCollection().updateOne(
                { primaryDid: did },
                { $unset: { escrowEnrollmentLease: '' } }
            );
        };

        await refresh({ attemptsRemaining: 9, wrongAttempts: 0 });

        await expectConsistent();
        expect((await record())?.escrowPin).toMatchObject({ salt: refreshSalt });
    });

    it('after a crash, keeps refusing compares until the lease expires, then the next request adopts the commit', async () => {
        await signedInWithPin();
        const oldBlob = (await record())?.escrowBlob;
        const early = await startPin();
        // The response is lost and the authority is unreachable for the inline check too.
        hooks.afterCommit = async () => {
            hooks.afterCommit = undefined;
            stateFailures = 1;
            throw new EscrowUnavailableError('transport');
        };
        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toThrow();
        // Authority NEW, Mongo OLD, but held under the lease, which records the new salt.
        expect((await record())?.escrowBlob).toEqual(oldBlob);
        expect((await record())?.escrowEnrollmentLease).toMatchObject({
            pin: 'fresh',
            pinSalt: refreshSalt,
        });
        await expect(completePin(early)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });

        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(Date.now() + ESCROW_ENROLLMENT_LEASE_TTL_MS + 1_000);
        const hold = await startPin();

        await expectConsistent();
        const stored = await record();
        expect(stored?.escrowPin).toMatchObject({ salt: refreshSalt, failedAttempts: 0 });
        expect(stored?.escrowEnrollmentLease).toBeUndefined();
        expect(hold.pinSalt).toBe(refreshSalt);
        await completePin(hold);
    });
});

describe('lease lifecycle', () => {
    const leaseFor = async (expiresAt: Date): Promise<EscrowEnrollmentLease> => ({
        id: randomUUID(),
        expiresAt,
        action: 'replace',
        pinAction: 'change',
        pin: 'fresh',
        pinSalt: refreshSalt,
        shareVersion: 1,
        authorityGeneration: 'g1',
        expectedEnrollmentVersion: authority.enrollmentVersion,
        expectedPinGeneration: authority.pinGeneration,
        enrollmentEpoch: authority.enrollmentEpoch + 1,
        sourceBlobHash: (await identity(authority.envelope)) as string,
        measurements: {},
    });

    it('a live lease refuses compares, new holds and other PIN operations without touching the authority', async () => {
        await signedInWithPin();
        const early = await startPin();
        const lease = await leaseFor(new Date(Date.now() + 60_000));
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { escrowEnrollmentLease: lease } }
        );
        const releasesBefore = releaseCalls;

        await expect(completePin(early)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        // A hold created now would be bound to the copy the lease's intent replaces.
        await expect(startPin()).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: 'Automatic recovery is being updated. Please try again in a moment.',
        });
        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(releaseCalls).toBe(releasesBefore);
        expect(applyCalls).toBe(0);
        expect((await record())?.escrowPin).toMatchObject({ failedAttempts: 1 });
    });

    it('an expired lease the authority never committed is released and the PIN works again', async () => {
        await signedInWithPin();
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { escrowEnrollmentLease: await leaseFor(new Date(Date.now() - 1)) } }
        );
        const before = await record();

        await completePin(await startPin());

        const stored = await record();
        expect(stored?.escrowEnrollmentLease).toBeUndefined();
        expect(stored?.escrowBlob).toEqual(before?.escrowBlob);
        expect(stored?.escrowPin).toMatchObject({ salt: pinSalt, failedAttempts: 2 });
    });

    it('an expired compare marker no longer blocks a lease', async () => {
        await signedInWithPin();
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            {
                $set: {
                    escrowPinCompares: [
                        {
                            id: randomUUID(),
                            expiresAt: new Date(Date.now() - ESCROW_PIN_COMPARE_TTL_MS),
                        },
                    ],
                },
            }
        );

        await refresh({ attemptsRemaining: 9, wrongAttempts: 0 });

        await expectConsistent();
    });

    it('releases the lease when the authority refuses the intent', async () => {
        await signedInWithPin();
        hooks.beforeApply = async () => {
            throw new EscrowPolicyError();
        };

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });

        expect((await record())?.escrowEnrollmentLease).toBeUndefined();
        await expectConsistent();
        await completePin(await startPin());
    });
});

describe('holds and compares around a committed PIN operation', () => {
    it('refuses a PIN hold bound to the copy a PIN operation replaced, before charging a guess', async () => {
        await signedInWithPin();
        const stale = await startPin();
        await refresh({ attemptsRemaining: 9, wrongAttempts: 0 });
        const releasesBefore = releaseCalls;

        await expect(completePin(stale)).rejects.toMatchObject({ code: 'FORBIDDEN' });

        // The authority would refuse the stale hold without counting it: so does Mongo.
        expect(releaseCalls).toBe(releasesBefore);
        expect((await record())?.escrowPin).toMatchObject({ salt: refreshSalt, failedAttempts: 0 });
        await completePin(await startPin());
    });

    it('a failed in-flight marker release never replaces the outcome of an answered compare', async () => {
        await signedInWithPin();
        const updateOne = Collection.prototype.updateOne;
        vi.spyOn(Collection.prototype, 'updateOne').mockImplementation(function (
            this: Collection,
            ...args: Parameters<Collection['updateOne']>
        ) {
            const update = args[1] as { $pull?: Record<string, unknown> };
            if (update?.$pull?.escrowPinCompares) return Promise.reject(new Error('transient'));
            return updateOne.apply(this, args);
        } as Collection['updateOne']);

        // Mismatch: the attempts-remaining answer, and the hold is still cancelled.
        const attacker = await startPin();
        await expect(completePin(attacker, wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: expect.stringMatching(/attempt/i),
        });
        expect(
            (await getEscrowHoldsCollection().findOne({ _id: attacker.holdId as never }))?.status
        ).toBe('cancelled');
        // Success: the released share still reaches the owner.
        const released = await completePin(await startPin());
        expect(released.sealedShare).toBeDefined();
    });
});

describe('a settle that finds the commit already persisted', () => {
    it('returns the committed result when another request adopted it first', async () => {
        await signedInWithPin();
        hooks.afterCommit = async () => {
            hooks.afterCommit = undefined;
            // Another request settles this (now expired) lease before the route's own write.
            await getUserKeysCollection().updateOne(
                { primaryDid: did },
                { $set: { 'escrowEnrollmentLease.expiresAt': new Date(Date.now() - 1) } }
            );
            await startPin();
        };

        await expect(refresh({ attemptsRemaining: 9, wrongAttempts: 0 })).resolves.toMatchObject({
            success: true,
        });

        await expectConsistent();
        const stored = await record();
        expect(stored?.escrowPin).toMatchObject({ salt: refreshSalt, failedAttempts: 0 });
        expect(stored?.escrowEnrollmentLease).toBeUndefined();
    });
});

describe('background rewrap (authority mode)', () => {
    const nextKeyId = 'pin-lease-next';
    let rewrapCalls: number;

    /** Rotate the enclave key: the enrolled copy is now sealed under a previous key. */
    const rotate = async (): Promise<void> => {
        const nextKeys = await generateEscrowKeyPair();
        const enclave = getEscrowEnclave();
        const base = await enclave.getAttestation();
        rewrapCalls = 0;
        Object.assign(enclave, {
            getAttestation: async (): Promise<EnclaveAttestation> => ({
                ...base,
                keyId: nextKeyId,
                previousKeyIds: [keyId],
            }),
            // Models authority_rewrap: refuses any copy but the committed one, advances
            // the enrollment version only (epoch, PIN generation and attempts unchanged).
            rewrapEscrowBlob: async (input: Parameters<EscrowEnclave['rewrapEscrowBlob']>[0]) => {
                rewrapCalls += 1;
                if ((await identity(input.envelope)) !== (await identity(authority.envelope)))
                    throw new EscrowPolicyError();
                const plaintext = await decryptEscrowBlob(input.envelope, enclaveKeys.privateKey);
                const envelope = await encryptEscrowBlob(plaintext, nextKeys.publicKey, nextKeyId);
                authority.enrollmentVersion += 1;
                authority.operationRevision += 1;
                authority.envelope = envelope;
                await hooks.afterRewrap?.();
                return {
                    envelope,
                    authority: {
                        envelope,
                        receipt,
                        authorityGeneration: 'g1',
                        enrollmentVersion: authority.enrollmentVersion,
                        enrollmentEpoch: authority.enrollmentEpoch,
                    },
                };
            },
        });
        __resetEscrowAttestationCacheForTests();
    };

    it('holds the lease across its authority commit, so no PIN operation can claim it in between', async () => {
        await signedInWithPin();
        await rotate();
        let concurrentClaim: unknown = 'not-run';
        hooks.afterRewrap = async () => {
            hooks.afterRewrap = undefined;
            const current = await record();
            // A same-PIN refresh's claim, made between the rewrap's commit and its write.
            concurrentClaim = await claimEscrowEnrollmentLease(authProvider, {
                lease: {
                    id: randomUUID(),
                    expiresAt: new Date(Date.now() + 60_000),
                    action: 'replace',
                    pinAction: 'change',
                    pin: 'fresh',
                    pinSalt: refreshSalt,
                    shareVersion: 1,
                    authorityGeneration: 'g1',
                    expectedEnrollmentVersion: authority.enrollmentVersion - 1,
                    expectedPinGeneration: authority.pinGeneration,
                    enrollmentEpoch: authority.enrollmentEpoch + 1,
                    sourceBlobHash: current!.escrowBlob!.blobHash,
                    measurements: {},
                },
                expectedBlob: current!.escrowBlob,
                expectedPin: current!.escrowPin,
                requireOptedIn: true,
            });
            // PIN compares are refused too.
            await expect(startPin()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        };

        await runEscrowBlobRewrap();

        expect(rewrapCalls).toBe(1);
        expect(concurrentClaim).toBeNull();
        await expectConsistent();
        const stored = await record();
        expect(stored?.escrowBlob?.enclaveKeyId).toBe(nextKeyId);
        expect(stored?.escrowEnrollmentLease).toBeUndefined();
        expect(stored?.escrowPin).toMatchObject({ salt: pinSalt, failedAttempts: 1 });
    });

    it('skips an account whose PIN operation holds the lease, without calling the authority', async () => {
        await signedInWithPin();
        await rotate();
        const current = await record();
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            {
                $set: {
                    escrowEnrollmentLease: {
                        id: randomUUID(),
                        expiresAt: new Date(Date.now() + 60_000),
                        action: 'replace',
                        pinAction: 'change',
                        pin: 'fresh',
                        pinSalt: refreshSalt,
                        shareVersion: 1,
                        authorityGeneration: 'g1',
                        expectedEnrollmentVersion: authority.enrollmentVersion,
                        expectedPinGeneration: authority.pinGeneration,
                        enrollmentEpoch: authority.enrollmentEpoch + 1,
                        sourceBlobHash: current!.escrowBlob!.blobHash,
                        measurements: {},
                    },
                },
            }
        );

        await runEscrowBlobRewrap();

        expect(rewrapCalls).toBe(0);
        expect((await record())?.escrowBlob).toEqual(current?.escrowBlob);
        await expectConsistent();
    });

    it('adopts its own commit when the lease write misses', async () => {
        await signedInWithPin();
        await rotate();
        hooks.afterRewrap = async () => {
            hooks.afterRewrap = undefined;
            await getUserKeysCollection().updateOne(
                { primaryDid: did },
                { $unset: { escrowEnrollmentLease: '' } }
            );
        };

        await runEscrowBlobRewrap();

        await expectConsistent();
        expect((await record())?.escrowBlob?.enclaveKeyId).toBe(nextKeyId);
    });
});
