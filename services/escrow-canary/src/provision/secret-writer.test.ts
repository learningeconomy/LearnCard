import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountSecret } from '../secrets';
import { runnerConfig } from '../tier3/test-fakes';
import { ProvisionError } from './errors';
import {
    CURRENT,
    DESCRIBE_LAG_BACKOFF_MS,
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
let slept: number[];
beforeEach(() => {
    world = new ProvisionWorld();
    slept = [];
});

/** World clock: `sleep` advances `world.now` and is recorded. */
const clock = () => ({
    now: () => world.now,
    sleep: async (ms: number) => {
        slept.push(ms);
        world.now += ms;
    },
});

/** True label position (bypasses the simulated DescribeSecret lag). */
const holderOf = async (stage: string) =>
    versionWith({ arn: '', name: '', versions: world.stagesOf(SECRET_ID) }, stage);

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
        const a = new ProvisioningVersion(world.secretStore, SECRET_ID, undefined, clock());
        const b = new ProvisioningVersion(world.secretStore, SECRET_ID, undefined, clock());
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
        const first = new ProvisioningVersion(world.secretStore, SECRET_ID, undefined, clock());
        const staged = await first.write(secretFor('a'));
        interleave();
        const existing = { versionId: staged, secret: secretFor('a') };
        const a = new ProvisioningVersion(world.secretStore, SECRET_ID, existing, clock());
        const b = new ProvisioningVersion(world.secretStore, SECRET_ID, existing, clock());
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
        const writer = new ProvisioningVersion(store, SECRET_ID, undefined, clock());
        const versionId = await writer.write(secretFor('a'));
        expect(writer.versionId).toBe(versionId);
        expect(await holderOf(PROVISIONING)).toBe(versionId);
    });

    it('a claim that failed without committing is a plain retryable stop (exit 1)', async () => {
        const store = world.secretStore;
        store.moveStage = async () => {
            throw new Error('Throttling');
        };
        const writer = new ProvisioningVersion(store, SECRET_ID, undefined, clock());
        await expect(writer.write(secretFor('a'))).rejects.toMatchObject({
            message: 'secret: claim',
            exitCode: 1,
        });
        expect(await holderOf(PROVISIONING)).toBeUndefined();
        // The unclaimed version carries only the scratch label, which nothing reads.
        expect(await holderOf(PENDING)).toBeDefined();
    });

    it('promotion detaches both staging labels', async () => {
        const writer = new ProvisioningVersion(world.secretStore, SECRET_ID, undefined, clock());
        await writer.write(secretFor('a'));
        await writer.promote('v-initial');
        expect(await holderOf(CURRENT)).toBe(writer.versionId);
        expect(await holderOf(PROVISIONING)).toBeUndefined();
        expect(await holderOf(PENDING)).toBeUndefined();
    });
});

describe('PROVISIONING lease', () => {
    const writer = (existing?: { versionId: string; secret: AccountSecret }) =>
        new ProvisioningVersion(world.secretStore, SECRET_ID, existing, clock());
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

/**
 * DescribeSecret is eventually consistent: right after a label move it may still
 * show the label absent or on this run's previous version (staging, 2026-11-03:
 * a run stopped with `provisioning_label_moved` on its own committed claim).
 */
describe("PROVISIONING reads that lag this run's own label move", () => {
    const writer = (existing?: { versionId: string; secret: AccountSecret }) =>
        new ProvisioningVersion(world.secretStore, SECRET_ID, existing, clock());
    const takeOver = async (holder: string) => {
        const other = writer({ versionId: holder, secret: secretFor('a') });
        await other.write(secretFor('a'));
        return other;
    };

    it('fence after a fresh claim re-reads a describe that still shows no label', async () => {
        world.describeLag = 2;
        const owner = writer();
        const versionId = await owner.write(secretFor('a'));
        await owner.fence();
        expect(owner.versionId).toBe(versionId);
        expect(slept).toEqual(DESCRIBE_LAG_BACKOFF_MS.slice(0, 2));
        // The next write's early check also tolerates the lag.
        world.describeLag = 1;
        await owner.write(secretFor('b'));
        await owner.write(secretFor('c'));
        expect(await holderOf(PROVISIONING)).toBe(owner.versionId);
    });

    it('fence after a renewal re-reads a describe still showing the previous version', async () => {
        const owner = writer();
        const first = await owner.write(secretFor('a'));
        world.describeLag = 3;
        world.now += RENEW_MS;
        await owner.fence();
        const renewed = owner.versionId;
        expect(renewed).not.toBe(first);
        await owner.fence();
        expect(owner.versionId).toBe(renewed);
        expect(slept.length).toBeGreaterThan(0);
        await owner.promote('v-initial');
        expect(await holderOf(CURRENT)).toBe(renewed);
    });

    it('a resumed claim followed by a lagging fence proceeds', async () => {
        const staged = await writer().write(secretFor('a'));
        world.describeLag = 2;
        const resumed = writer({ versionId: staged, secret: secretFor('a') });
        await resumed.write(secretFor('a'));
        await resumed.fence();
        expect(await holderOf(PROVISIONING)).toBe(resumed.versionId);
    });

    it('a claim whose response was lost is confirmed through a lagging describe', async () => {
        const owner = writer();
        await owner.write(secretFor('a'));
        world.now += RENEW_MS;
        world.describeLag = 2;
        const store = world.secretStore;
        const move = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            await move(secretId, stage, to, from);
            if (stage === PROVISIONING) throw new Error('InvalidParameter');
        };
        const renewed = await owner.write(secretFor('a'));
        expect(owner.versionId).toBe(renewed);
        expect(await holderOf(PROVISIONING)).toBe(renewed);
    });

    it('a fresh claim whose response was lost is confirmed through a lagging describe', async () => {
        world.describeLag = 2;
        const store = world.secretStore;
        const move = store.moveStage;
        store.moveStage = async (secretId, stage, to, from) => {
            await move(secretId, stage, to, from);
            if (stage === PROVISIONING) throw new Error('InvalidParameter');
        };
        const owner = writer();
        const versionId = await owner.write(secretFor('a'));
        expect(owner.versionId).toBe(versionId);
    });

    it('a version this run never wrote is a takeover (exit 3) after the bounded re-reads', async () => {
        const owner = writer();
        const mine = await owner.write(secretFor('a'));
        await takeOver(mine);
        world.describes = 0;
        slept = [];
        await expect(owner.fence()).rejects.toMatchObject({
            message: 'secret: provisioning_label_moved',
            exitCode: 3,
        });
        expect(world.describes).toBe(DESCRIBE_LAG_BACKOFF_MS.length + 1);
        expect(slept).toEqual(DESCRIBE_LAG_BACKOFF_MS);
    });

    it('a resume whose describe still shows the holder before the resumed version proceeds', async () => {
        // Run A renews V0 -> V1; run B resumes V1 while describe still shows V0,
        // a version B never saw.
        const a = writer();
        const v0 = await a.write(secretFor('a'));
        world.describeLag = 2;
        world.now += RENEW_MS;
        await a.write(secretFor('a'));
        const v1 = a.versionId!;
        expect(v1).not.toBe(v0);
        const b = writer({ versionId: v1, secret: secretFor('a') });
        const claimed = await b.write(secretFor('a'));
        expect(await holderOf(PROVISIONING)).toBe(claimed);
        expect(slept.length).toBeGreaterThan(0);
    });

    it('a fresh run whose describe still shows a just-detached stale label proceeds', async () => {
        const old = await writer().write(secretFor('a'));
        world.describeLag = 2;
        // The operator (or an earlier promote) detaches the stale label.
        await world.secretStore.moveStage(SECRET_ID, PROVISIONING, undefined, old);
        const fresh = writer();
        const versionId = await fresh.write(secretFor('b'));
        expect(await holderOf(PROVISIONING)).toBe(versionId);
        expect(slept).toEqual(DESCRIBE_LAG_BACKOFF_MS.slice(0, 2));
    });

    it('a failed claim whose re-read errors after showing no move is retryable (exit 1)', async () => {
        const store = world.secretStore;
        store.moveStage = async () => {
            throw new Error('Throttling');
        };
        const describe = store.describe;
        let calls = 0;
        store.describe = async secretId => {
            calls += 1;
            // 1: precheck, 2: first fallback read (label absent), 3: throttled.
            if (calls === 3) throw new Error('Throttling');
            return describe(secretId);
        };
        await expect(writer().write(secretFor('a'))).rejects.toMatchObject({
            message: 'secret: claim',
            exitCode: 1,
        });
    });

    it('a failed claim whose first re-read errors still stops for a human (exit 3)', async () => {
        const store = world.secretStore;
        store.moveStage = async () => {
            throw new Error('Throttling');
        };
        const describe = store.describe;
        let calls = 0;
        store.describe = async secretId => {
            calls += 1;
            if (calls === 2) throw new Error('Throttling');
            return describe(secretId);
        };
        await expect(writer().write(secretFor('a'))).rejects.toMatchObject({
            message: 'secret: provisioning_label_moved',
            exitCode: 3,
        });
    });

    it("a takeover behind a lagging read of this run's own move is still exit 3", async () => {
        const owner = writer();
        const first = await owner.write(secretFor('a'));
        world.describeLag = 2;
        world.now += RENEW_MS;
        await owner.fence(); // renewal: the next two describes still show `first`
        // Another run claims the renewed version over (raw calls: its own describes
        // would consume the stale reads this test is about).
        const store = world.secretStore;
        const theirs = await store.putPending(SECRET_ID, '{}', 'other-run');
        await store.moveStage(SECRET_ID, PROVISIONING, theirs, owner.versionId);
        slept = [];
        await expect(owner.fence()).rejects.toMatchObject({
            reason: 'provisioning_label_moved',
            exitCode: 3,
        });
        expect(slept).toEqual(DESCRIBE_LAG_BACKOFF_MS);
        expect(first).not.toBe(owner.versionId);
        await expect(owner.promote('v-initial')).rejects.toMatchObject({ exitCode: 3 });
        expect(await holderOf(CURRENT)).toBe('v-initial');
    });

    it('a competing first write still loses with provisioning_label_moved under lag', async () => {
        world.describeLag = 2;
        const a = writer();
        const b = writer();
        await a.write(secretFor('a'));
        await expect(b.write(secretFor('b'))).rejects.toMatchObject({
            message: 'secret: provisioning_label_moved',
            exitCode: 3,
        });
        expect(await holderOf(PROVISIONING)).toBe(a.versionId);
    });

    it('lag that outlasts the bounded backoff is a retryable stop (exit 1), never exit 3', async () => {
        world.describeLag = 1_000;
        const owner = writer();
        await owner.write(secretFor('a'));
        await expect(owner.fence()).rejects.toMatchObject({
            message: 'secret: provisioning_label_lag',
            exitCode: 1,
        });
        expect(slept).toEqual(DESCRIBE_LAG_BACKOFF_MS);
        expect(slept.reduce((sum, ms) => sum + ms, 0)).toBeLessThanOrEqual(5_000);
    });
});
