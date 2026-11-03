import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountSecret } from '../secrets';
import { runnerConfig } from '../tier3/test-fakes';
import { ProvisionError } from './errors';
import {
    CURRENT,
    LEASE_MS,
    leaseHeld,
    PENDING,
    PROVISIONING,
    ProvisioningVersion,
    RENEW_MS,
    versionWith,
} from './secret-writer';
import { barrier, ProvisionWorld } from './test-world';

const SECRET_ID = runnerConfig.holdAccounts[0].secretId;

const secretFor = (key: string): AccountSecret => ({
    accountId: runnerConfig.holdAccounts[0].id,
    privateKey: key.padStart(64, 'f'),
    did: `did:key:z${key}`,
    pin: '58273914',
    refreshToken: `refresh-${key}`,
    recoveryEmail: 'canary-staging+1@inbox.example.com',
    recoveryLanguage: 'en',
    deviceState: { shares: {}, versions: {} },
});

let world: ProvisionWorld;
beforeEach(() => {
    world = new ProvisionWorld();
});

const holderOf = async (stage: string) =>
    versionWith(await world.secretStore.describe(SECRET_ID), stage);

/** Both writers' prechecks and puts complete before either claims (worst case). */
const interleave = () => {
    const store = world.secretStore;
    const put = store.putPending;
    const move = store.moveStage;
    const puts = barrier(2);
    const claims = barrier(2);
    store.putPending = async (...args) => {
        await puts();
        return put(...args);
    };
    store.moveStage = async (secretId, stage, to, from) => {
        if (stage === PROVISIONING) await claims();
        return move(secretId, stage, to, from);
    };
};

const settle = async (writes: Promise<string>[]) => {
    const results = await Promise.allSettled(writes);
    const won = results.flatMap(result => (result.status === 'fulfilled' ? [result.value] : []));
    const lost = results.flatMap(result =>
        result.status === 'rejected' ? [result.reason as ProvisionError] : []
    );
    return { won, lost };
};

describe('PROVISIONING claim', () => {
    it('two first writes that both saw no label: exactly one claims, the other stops (exit 3)', async () => {
        interleave();
        const a = new ProvisioningVersion(world.secretStore, SECRET_ID);
        const b = new ProvisioningVersion(world.secretStore, SECRET_ID);
        const { won, lost } = await settle([a.write(secretFor('a')), b.write(secretFor('b'))]);
        expect(won).toHaveLength(1);
        expect(lost).toHaveLength(1);
        expect(lost[0]).toBeInstanceOf(ProvisionError);
        expect(lost[0].message).toBe('secret: provisioning_label_moved');
        expect(lost[0].exitCode).toBe(3);
        expect(await holderOf(PROVISIONING)).toBe(won[0]);
        // The loser's next write also fails: it never owns the label.
        const loser = a.versionId === won[0] ? b : a;
        expect(loser.versionId).toBeUndefined();
        await expect(loser.write(secretFor('c'))).rejects.toMatchObject({
            reason: 'provisioning_label_moved',
        });
        expect(await holderOf(PROVISIONING)).toBe(won[0]);
    });

    it('two runs resuming the same version: exactly one moves the label', async () => {
        const first = new ProvisioningVersion(world.secretStore, SECRET_ID);
        const staged = await first.write(secretFor('a'));
        interleave();
        const existing = { versionId: staged, secret: secretFor('a') };
        const a = new ProvisioningVersion(world.secretStore, SECRET_ID, existing);
        const b = new ProvisioningVersion(world.secretStore, SECRET_ID, existing);
        const { won, lost } = await settle([a.write(secretFor('a')), b.write(secretFor('a'))]);
        expect(won).toHaveLength(1);
        expect(lost.map(error => error.reason)).toEqual(['provisioning_label_moved']);
        expect(await holderOf(PROVISIONING)).toBe(won[0]);
    });

    it('a claim whose response was lost and whose retry failed is still a success', async () => {
        const store = world.secretStore;
        const move = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            await move(secretId, stage, to, from);
            if (stage === PROVISIONING) throw new Error('InvalidParameter');
        };
        const writer = new ProvisioningVersion(store, SECRET_ID);
        const versionId = await writer.write(secretFor('a'));
        expect(writer.versionId).toBe(versionId);
        expect(await holderOf(PROVISIONING)).toBe(versionId);
    });

    it('a claim that failed without committing is a plain retryable stop (exit 1)', async () => {
        const store = world.secretStore;
        store.moveStage = async () => {
            throw new Error('Throttling');
        };
        const writer = new ProvisioningVersion(store, SECRET_ID);
        await expect(writer.write(secretFor('a'))).rejects.toMatchObject({
            message: 'secret: claim',
            exitCode: 1,
        });
        expect(await holderOf(PROVISIONING)).toBeUndefined();
        // The unclaimed version carries only the scratch label, which nothing reads.
        expect(await holderOf(PENDING)).toBeDefined();
    });

    it('promotion detaches both staging labels', async () => {
        const writer = new ProvisioningVersion(world.secretStore, SECRET_ID);
        await writer.write(secretFor('a'));
        await writer.promote('v-initial');
        expect(await holderOf(CURRENT)).toBe(writer.versionId);
        expect(await holderOf(PROVISIONING)).toBeUndefined();
        expect(await holderOf(PENDING)).toBeUndefined();
    });
});

describe('PROVISIONING lease', () => {
    const writer = (existing?: { versionId: string; secret: AccountSecret }) =>
        new ProvisioningVersion(world.secretStore, SECRET_ID, existing, { now: () => world.now });
    /** Another run takes `owner`'s version over (after the lease, or with --takeover). */
    const takeOver = async () => {
        const holder = (await holderOf(PROVISIONING))!;
        const other = writer({ versionId: holder, secret: secretFor('a') });
        await other.write(secretFor('a'));
        return other;
    };

    it('a claimed version is held until LEASE_MS; unknown age counts as held', () => {
        expect(leaseHeld(1_000, 1_000 + LEASE_MS - 1)).toBe(true);
        expect(leaseHeld(1_000, 1_000 + LEASE_MS)).toBe(false);
        expect(leaseHeld(undefined, Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('fence passes for a fresh claim without writing', async () => {
        const owner = writer();
        const versionId = await owner.write(secretFor('a'));
        world.calls = [];
        await owner.fence();
        expect(world.calls).toEqual([]);
        expect(owner.versionId).toBe(versionId);
    });

    it('fence renews a claim older than RENEW_MS with a new conditional claim', async () => {
        const owner = writer();
        const first = await owner.write(secretFor('a'));
        world.now += RENEW_MS;
        await owner.fence();
        expect(owner.versionId).not.toBe(first);
        expect(await holderOf(PROVISIONING)).toBe(owner.versionId);
        expect(await owner.readBack()).toEqual(secretFor('a'));
    });

    it('fence stops a run whose claim was taken over (exit 3), with or without a renewal', async () => {
        const owner = writer();
        await owner.write(secretFor('a'));
        await takeOver();
        await expect(owner.fence()).rejects.toMatchObject({
            message: 'secret: provisioning_label_moved',
            exitCode: 3,
        });
        world.now += RENEW_MS;
        await expect(owner.fence()).rejects.toMatchObject({
            reason: 'provisioning_label_moved',
        });
    });

    it('a run whose claim was taken over never moves AWSCURRENT', async () => {
        const owner = writer();
        await owner.write(secretFor('a'));
        world.now += LEASE_MS;
        const other = await takeOver();
        await expect(owner.promote('v-initial')).rejects.toMatchObject({
            reason: 'provisioning_label_moved',
            exitCode: 3,
        });
        expect(await holderOf(CURRENT)).toBe('v-initial');
        await other.promote('v-initial');
        expect(await holderOf(CURRENT)).toBe(other.versionId);
    });

    it('a takeover between the fence and the detach is reported, not swallowed', async () => {
        const owner = writer();
        await owner.write(secretFor('a'));
        const store = world.secretStore;
        const move = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            if (stage === PROVISIONING && to === undefined) {
                store.moveStage = move;
                await takeOver();
            }
            return move(secretId, stage, to, from);
        };
        await expect(owner.promote('v-initial')).rejects.toMatchObject({
            message: 'promote: provisioning_label_moved',
            exitCode: 3,
        });
        expect(await holderOf(CURRENT)).toBe(owner.versionId);
    });

    it('a detach whose response was lost is still a success', async () => {
        const owner = writer();
        await owner.write(secretFor('a'));
        const store = world.secretStore;
        const move = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            await move(secretId, stage, to, from);
            if (stage === PROVISIONING && to === undefined) throw new Error('InvalidParameter');
        };
        await owner.promote('v-initial');
        expect(await holderOf(CURRENT)).toBe(owner.versionId);
        expect(await holderOf(PROVISIONING)).toBeUndefined();
    });
});
