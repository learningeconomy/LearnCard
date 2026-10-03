import { randomUUID } from 'crypto';
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { client } from '@mongo';
import { encryptEscrowBlob, generateEscrowKeyPair } from '@learncard/sss-key-manager';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    upsertUserKeyByAuthProvider,
    setEscrowBlobByAuthProvider,
    findUserKeyByAuthProvider,
    createEscrowHoldsIndexes,
    getEscrowHoldsCollection,
    createEscrowHold,
    generateEscrowResumeToken,
    hashEscrowResumeToken,
    type AuthProviderMapping,
    type EscrowBlob,
} from '@models';
import { __setEscrowEnclaveForTests } from '../../src/services/escrow-enclave';
import { runEscrowBlobRewrap } from '../../src/jobs/escrowBlobRewrap';

const seededProviderIds: string[] = [];

const makeProvider = (): AuthProviderMapping => {
    const provider: AuthProviderMapping = {
        type: 'firebase',
        id: `escrow-rewrap-job-${randomUUID()}`,
    };
    seededProviderIds.push(provider.id);
    return provider;
};

let previousKeys: { publicKey: string; privateKey: string };
let currentKeys: { publicKey: string; privateKey: string };

/**
 * Seeds a UserKey with an escrow blob sealed under the given (public)
 * key/keyId. Only creates the account on the FIRST call for a given
 * provider — a second call (used to simulate a mid-run re-enrollment onto a
 * different key) must not re-run `upsertUserKeyByAuthProvider` with the same
 * `authShare`, which would bump the account's own `shareVersion` and break
 * the escrow blob's `expectedShareVersion: 1` CAS below.
 */
const seedBlob = async (
    provider: AuthProviderMapping,
    keyId: string,
    publicKey: string
): Promise<EscrowBlob> => {
    if (!(await findUserKeyByAuthProvider(provider.type, provider.id))) {
        await upsertUserKeyByAuthProvider(
            { type: 'email', value: `${provider.id}@example.com` },
            provider,
            {
                primaryDid: 'did:key:test',
                authShare: { encryptedData: 'data', encryptedDek: 'dek', iv: 'iv' },
            }
        );
    }
    const envelope = await encryptEscrowBlob(
        { recoveryShare: 'ab'.repeat(33), did: 'did:key:test', shareVersion: 1 },
        publicKey,
        keyId
    );
    const stored = await setEscrowBlobByAuthProvider(
        provider,
        {
            envelope,
            enclaveKeyId: keyId,
            enclaveMode: 'software',
            measurements: {},
            shareVersion: 1,
            createdAt: new Date(),
        },
        1
    );
    return stored!.escrowBlob!;
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    previousKeys = await generateEscrowKeyPair();
    currentKeys = await generateEscrowKeyPair();
    process.env.ESCROW_ENCLAVE_MODE = 'software';
    process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
        current: currentKeys.privateKey,
        previous: previousKeys.privateKey,
    });
    process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID = 'current';
    __setEscrowEnclaveForTests(undefined);
    await client.connect();
    await createUserKeysIndexes();
    await createEscrowHoldsIndexes();
});

afterEach(async () => {
    const ids = seededProviderIds.splice(0);
    if (ids.length === 0) return;
    await getUserKeysCollection().deleteMany({ 'authProviders.id': { $in: ids } });
    await getEscrowHoldsCollection().deleteMany({ 'authProvider.id': { $in: ids } });
});

afterAll(async () => {
    delete process.env.ESCROW_ENCLAVE_MODE;
    delete process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON;
    delete process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID;
    __setEscrowEnclaveForTests(undefined);
    await client.close();
});

describe('runEscrowBlobRewrap', () => {
    it('migrates a previous-key blob onto the current key: keyId now current, epoch+1, version unchanged, escrowPin untouched', async () => {
        const provider = makeProvider();
        const oldBlob = await seedBlob(provider, 'previous', previousKeys.publicKey);
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': provider.id },
            {
                $set: {
                    escrowPin: {
                        salt: Buffer.alloc(16).toString('base64'),
                        failedAttempts: 3,
                        enabledAt: new Date(),
                        shareVersion: 1,
                    },
                },
            }
        );

        const result = await runEscrowBlobRewrap();

        expect(result).toEqual({ rewrapped: 1, skippedPendingHold: 0, failed: 0 });
        const stored = await findUserKeyByAuthProvider(provider.type, provider.id);
        expect(stored?.escrowBlob?.enclaveKeyId).toBe('current');
        expect(stored?.escrowBlob?.envelope.keyId).toBe('current');
        expect(stored?.escrowBlob?.shareVersion).toBe(1);
        expect(stored?.escrowBlob?.enrollmentEpoch).toBe(oldBlob.enrollmentEpoch + 1);
        expect(stored?.escrowBlob?.blobHash).not.toBe(oldBlob.blobHash);
        expect(stored?.escrowPin?.failedAttempts).toBe(3);
        // Idempotent: nothing left to migrate on a second run.
        expect(await runEscrowBlobRewrap()).toEqual({
            rewrapped: 0,
            skippedPendingHold: 0,
            failed: 0,
        });
    });

    it('skips (does not touch) an account with a pending recovery hold', async () => {
        const provider = makeProvider();
        const oldBlob = await seedBlob(provider, 'previous', previousKeys.publicKey);
        await createEscrowHold({
            holdRecord: {
                hold: {
                    holdId: randomUUID(),
                    did: 'did:key:test',
                    shareVersion: 1,
                    blobHash: oldBlob.blobHash,
                    enrollmentEpoch: oldBlob.enrollmentEpoch,
                    releasePolicy: 'hold',
                    clientEphemeralPublicKey: 'public-key',
                    createdLo: 0,
                    createdHi: 0,
                    policyVersion: 1,
                    signature: 'test-signature',
                },
                holdDurationMs: 0,
                ledgerSeq: 0,
            },
            authProvider: provider,
            primaryDid: 'did:key:test',
            shareVersion: 1,
            identityProofType: 'auth-token',
            requestedAt: new Date(),
            releaseAfter: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            releasePolicy: 'hold',
            clientEphemeralPublicKey: 'public-key',
            resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
        });

        const result = await runEscrowBlobRewrap();

        expect(result).toEqual({ rewrapped: 0, skippedPendingHold: 1, failed: 0 });
        const stored = await findUserKeyByAuthProvider(provider.type, provider.id);
        expect(stored?.escrowBlob).toEqual(oldBlob);
    });

    it('never touches a blob sealed under a truly unknown (never current, never previous) key', async () => {
        const provider = makeProvider();
        const unknown = await generateEscrowKeyPair();
        const oldBlob = await seedBlob(provider, 'totally-unknown', unknown.publicKey);

        const result = await runEscrowBlobRewrap();

        expect(result).toEqual({ rewrapped: 0, skippedPendingHold: 0, failed: 0 });
        const stored = await findUserKeyByAuthProvider(provider.type, provider.id);
        expect(stored?.escrowBlob).toEqual(oldBlob);
    });

    it('concurrent runs never double-write the same account (CAS)', async () => {
        const provider = makeProvider();
        await seedBlob(provider, 'previous', previousKeys.publicKey);

        const [a, b] = await Promise.all([runEscrowBlobRewrap(), runEscrowBlobRewrap()]);

        expect(a.rewrapped + b.rewrapped).toBe(1);
        expect(a.failed + b.failed).toBe(0);
        const stored = await findUserKeyByAuthProvider(provider.type, provider.id);
        expect(stored?.escrowBlob?.enclaveKeyId).toBe('current');
    });

    it('a user who re-enrolled onto the current key mid-run wins the race (CAS no-op)', async () => {
        const provider = makeProvider();
        await seedBlob(provider, 'previous', previousKeys.publicKey);
        // Simulates a concurrent P9.2 sign-in re-enroll landing between the
        // job's candidate read and its write: the account is already on the
        // current key by the time the job's CAS write is attempted.
        await seedBlob(provider, 'current', currentKeys.publicKey);

        const result = await runEscrowBlobRewrap();

        expect(result).toEqual({ rewrapped: 0, skippedPendingHold: 0, failed: 0 });
    });

    it('no-ops without querying Mongo when the enclave has no previous keys configured', async () => {
        process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
            current: currentKeys.privateKey,
        });
        __setEscrowEnclaveForTests(undefined);
        try {
            const provider = makeProvider();
            const oldBlob = await seedBlob(provider, 'previous', previousKeys.publicKey);

            const result = await runEscrowBlobRewrap();

            expect(result).toEqual({ rewrapped: 0, skippedPendingHold: 0, failed: 0 });
            const stored = await findUserKeyByAuthProvider(provider.type, provider.id);
            expect(stored?.escrowBlob).toEqual(oldBlob);
        } finally {
            process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
                current: currentKeys.privateKey,
                previous: previousKeys.privateKey,
            });
            __setEscrowEnclaveForTests(undefined);
        }
    });

    it('no-ops without touching the database when escrow is disabled', async () => {
        const provider = makeProvider();
        const oldBlob = await seedBlob(provider, 'previous', previousKeys.publicKey);
        delete process.env.ESCROW_ENCLAVE_MODE;
        __setEscrowEnclaveForTests(undefined);

        try {
            const result = await runEscrowBlobRewrap();
            expect(result).toEqual({ rewrapped: 0, skippedPendingHold: 0, failed: 0 });
            const stored = await findUserKeyByAuthProvider(provider.type, provider.id);
            expect(stored?.escrowBlob).toEqual(oldBlob);
        } finally {
            process.env.ESCROW_ENCLAVE_MODE = 'software';
            __setEscrowEnclaveForTests(undefined);
        }
    });
});
