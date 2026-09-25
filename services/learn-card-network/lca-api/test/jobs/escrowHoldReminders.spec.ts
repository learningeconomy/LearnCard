import { randomUUID } from 'crypto';
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { client } from '@mongo';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    upsertUserKeyByAuthProvider,
    createEscrowHoldsIndexes,
    getEscrowHoldsCollection,
    createEscrowHold,
    findEscrowHoldById,
    completeEscrowHold,
    cancelEscrowHold,
    generateEscrowResumeToken,
    hashEscrowResumeToken,
    recordEscrowHoldNotification,
    type AuthProviderMapping,
} from '@models';
import { __setEscrowEnclaveForTests } from '../../src/services/escrow-enclave';
import { runEscrowHoldReminders } from '../../src/jobs/escrowHoldReminders';

const HOUR = 60 * 60 * 1000;
const seededProviderIds: string[] = [];

const makeProvider = (): AuthProviderMapping => {
    const provider: AuthProviderMapping = {
        type: 'firebase',
        id: `escrow-reminder-job-${randomUUID()}`,
    };
    seededProviderIds.push(provider.id);
    return provider;
};

/** Every seed() call gets its own authProvider (see test/models/escrow.spec.ts
 * for why: only one pending hold-policy hold is allowed per authProvider). */
const seed = async (releaseAfter: Date, releasePolicy: 'hold' | 'pin' = 'hold') => {
    const provider = makeProvider();
    await upsertUserKeyByAuthProvider(
        { type: 'email', value: `${provider.id}@example.com` },
        provider,
        {
            primaryDid: 'did:key:test',
            authShare: { encryptedData: 'data', encryptedDek: 'dek', iv: 'iv' },
        }
    );
    return createEscrowHold({
        authProvider: provider,
        primaryDid: 'did:key:test',
        shareVersion: 1,
        identityProofType: 'auth-token',
        requestedAt: new Date(),
        releaseAfter,
        releasePolicy,
        clientEphemeralPublicKey: 'public-key',
        resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
    });
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    process.env.ESCROW_ENCLAVE_MODE = 'software';
    process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
        dummy: 'x'.repeat(10),
    });
    process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID = 'dummy';
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

describe('runEscrowHoldReminders', () => {
    it('reminds a hold due within 24h exactly once, even racing two full job runs', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + 23 * HOUR));

        const [a, b] = await Promise.all([
            runEscrowHoldReminders({ now }),
            runEscrowHoldReminders({ now }),
        ]);

        expect(a.reminded + b.reminded).toBe(1);
        expect(a.failed + b.failed).toBe(0);
        const stored = await findEscrowHoldById(hold._id);
        expect(stored?.notifications.filter(entry => entry.kind === 'reminder')).toHaveLength(1);
    });

    it('does not remind a hold due more than 24h out', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + 25 * HOUR));

        const result = await runEscrowHoldReminders({ now });

        expect(result.reminded).toBe(0);
        expect((await findEscrowHoldById(hold._id))?.notifications).toEqual([]);
    });

    it('skips completed and cancelled holds', async () => {
        const now = new Date();
        const completed = await seed(new Date(now.getTime() + HOUR));
        await completeEscrowHold(completed._id);
        const cancelled = await seed(new Date(now.getTime() + 2 * HOUR));
        await cancelEscrowHold(cancelled._id, 'did');

        const result = await runEscrowHoldReminders({ now });

        expect(result.reminded).toBe(0);
        expect((await findEscrowHoldById(completed._id))?.notifications).toEqual([]);
        expect((await findEscrowHoldById(cancelled._id))?.notifications).toEqual([]);
    });

    it('skips holds already reminded', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));
        await recordEscrowHoldNotification(hold._id, 'reminder');

        const result = await runEscrowHoldReminders({ now });

        expect(result.reminded).toBe(0);
        expect((await findEscrowHoldById(hold._id))?.notifications).toHaveLength(1);
    });

    it('expires stale holds and reports the count alongside reminders sent in the same run', async () => {
        const now = new Date();
        const stale = await seed(new Date(now.getTime() - 31 * 24 * HOUR));
        const due = await seed(new Date(now.getTime() + HOUR));

        const result = await runEscrowHoldReminders({ now });

        expect(result.expired).toBe(1);
        expect(result.reminded).toBe(1);
        expect((await findEscrowHoldById(stale._id))?.status).toBe('expired');
        expect((await findEscrowHoldById(due._id))?.notifications.map(entry => entry.kind)).toEqual(
            ['reminder']
        );
    });

    it('counts a notifier failure as failed without throwing, and never retries the claimed hold', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));

        const result = await runEscrowHoldReminders({
            now,
            notify: async () => {
                throw new Error('delivery exploded');
            },
        });

        expect(result).toEqual({ reminded: 0, expired: 0, failed: 1 });
        // Claim-before-send means the claim IS the record: a failed send still
        // burns the hold's one reminder instead of retrying it next hour.
        const stored = await findEscrowHoldById(hold._id);
        expect(stored?.notifications.map(entry => entry.kind)).toEqual(['reminder']);
        const rerun = await runEscrowHoldReminders({ now });
        expect(rerun).toEqual({ reminded: 0, expired: 0, failed: 0 });
    });

    it('no-ops without touching the database when escrow is disabled', async () => {
        const now = new Date();
        const stale = await seed(new Date(now.getTime() - 31 * 24 * HOUR));
        delete process.env.ESCROW_ENCLAVE_MODE;
        __setEscrowEnclaveForTests(undefined);

        try {
            const result = await runEscrowHoldReminders({ now });
            expect(result).toEqual({ reminded: 0, expired: 0, failed: 0 });
            expect((await findEscrowHoldById(stale._id))?.status).toBe('pending');
        } finally {
            process.env.ESCROW_ENCLAVE_MODE = 'software';
            __setEscrowEnclaveForTests(undefined);
        }
    });
});
