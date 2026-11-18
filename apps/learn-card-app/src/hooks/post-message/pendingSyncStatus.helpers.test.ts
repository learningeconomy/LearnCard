import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const identity = vi.hoisted(() => ({
    walletDid: undefined as string | undefined,
    keyDid: 'did:key:learner',
    switchedDid: undefined as string | undefined,
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    walletStore: {
        get: {
            wallet: () =>
                identity.walletDid
                    ? {
                          id: {
                              did: (method?: string) =>
                                  method === 'key' ? identity.keyDid : identity.walletDid,
                          },
                      }
                    : null,
        },
    },
    switchedProfileStore: { get: { switchedDid: () => identity.switchedDid } },
}));
import {
    enqueuePendingContractSync,
    clearPendingContractSyncJob,
    hydratePendingContractSyncJobs,
    DONE_JOB_TTL_MS,
    MAX_JOB_RETRIES,
    pendingContractSyncStore,
} from 'learn-card-base/stores/pendingContractSyncStore';

import { getPendingSyncStatus, waitForPendingSync } from './pendingSyncStatus.helpers';

const LEARNER = 'did:example:learner';
const CONTRACT = 'contract-a';
const enqueueCredential = (profileDid = LEARNER) =>
    enqueuePendingContractSync({
        kind: 'credential',
        profileDid,
        record: { id: 'saved', uri: 'credential-a', category: 'Achievement' },
        category: 'Achievement',
    });
const enqueueContract = (contractUri = CONTRACT, profileDid = LEARNER) =>
    enqueuePendingContractSync({
        profileDid,
        contractUri,
        termsUri: `terms-${contractUri}`,
        ownerDid: 'did:example:owner',
    });
const exhaustRetries = async (id: string) => {
    for (let attempt = 0; attempt < MAX_JOB_RETRIES; attempt += 1) {
        await pendingContractSyncStore.set.markError(id, 'Sharing failed');
    }
};

beforeEach(async () => {
    identity.walletDid = undefined;
    identity.keyDid = 'did:key:learner';
    identity.switchedDid = undefined;
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(1000);
    await hydratePendingContractSyncJobs();
    await Promise.all(
        Object.keys(pendingContractSyncStore.get.jobs()).map(clearPendingContractSyncJob)
    );
});
afterEach(() => vi.useRealTimers());

it('keeps contract-scoped status syncing while account credential delivery is queued, running or retrying', async () => {
    const job = await enqueueCredential();
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('syncing');
    await pendingContractSyncStore.set.claimJob(job.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('syncing');
    await pendingContractSyncStore.set.markError(job.id, 'Offline');
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('syncing');
    await pendingContractSyncStore.set.markDone(job.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('ready');
});

it('excludes other profiles and unrelated contract jobs from scoped status', async () => {
    await enqueueCredential('did:example:other');
    await enqueueContract(CONTRACT, 'did:example:other');
    await enqueueContract('contract-b');
    expect(getPendingSyncStatus(LEARNER, CONTRACT)).toMatchObject({
        status: 'ready',
        progress: { totalCredentials: 0, completedCredentials: 0, retryCount: 0 },
    });
    expect(getPendingSyncStatus(LEARNER).status).toBe('syncing');
    expect(getPendingSyncStatus(undefined).status).toBe('ready');
});

it('keeps unattributed exhausted delivery errors global without poisoning scoped partners', async () => {
    const job = await enqueueCredential();
    await exhaustRetries(job.id);
    expect(getPendingSyncStatus(LEARNER)).toMatchObject({
        status: 'error',
        lastError: 'Sharing failed',
    });
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('ready');
    expect(getPendingSyncStatus(LEARNER, 'unrelated-contract').status).toBe('ready');
    expect(await waitForPendingSync(LEARNER, 'unrelated-contract')).toMatchObject({
        status: 'ready',
    });
});

it('does not let completed discovery hide a failure for the requested contract', async () => {
    const contract = await enqueueContract();
    await exhaustRetries(contract.id);
    vi.setSystemTime(2000);
    const credential = await enqueueCredential();
    await pendingContractSyncStore.set.markDone(credential.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT)).toMatchObject({
        status: 'error',
        lastError: 'Sharing failed',
    });
});

it('waits for queued credential delivery before telling a partner that its contract is ready', async () => {
    const job = await enqueueCredential();
    let settled = false;
    const waiting = waitForPendingSync(LEARNER, CONTRACT, 2000).then(result => {
        settled = true;
        return result;
    });
    await vi.waitFor(() => expect(vi.getTimerCount()).toBeGreaterThan(0));
    await vi.advanceTimersByTimeAsync(500);
    expect(settled).toBe(false);
    await pendingContractSyncStore.set.markDone(job.id);
    await vi.advanceTimersByTimeAsync(500);
    expect(await waiting).toMatchObject({ status: 'ready' });
});

it('returns syncing when the wait deadline expires without delivery', async () => {
    await enqueueCredential();
    const waiting = waitForPendingSync(LEARNER, CONTRACT, 1000);
    await vi.waitFor(() => expect(vi.getTimerCount()).toBeGreaterThan(0));
    await vi.advanceTimersByTimeAsync(1000);
    expect(await waiting).toMatchObject({ status: 'syncing' });
});

it('restores failed destinations and reports terminal errors only to the affected partner', async () => {
    const job = await enqueueCredential();
    await pendingContractSyncStore.set.setFailedContractUris(job.id, [CONTRACT]);
    await exhaustRetries(job.id);
    pendingContractSyncStore.set.jobs({});
    await hydratePendingContractSyncJobs();
    expect(getPendingSyncStatus(LEARNER, CONTRACT)).toMatchObject({
        status: 'error',
        lastError: 'Sharing failed',
        progress: { retryCount: MAX_JOB_RETRIES },
    });
    expect(getPendingSyncStatus(LEARNER, 'unrelated-contract').status).toBe('ready');
    expect(await waitForPendingSync(LEARNER, 'unrelated-contract')).toMatchObject({
        status: 'ready',
    });
    expect(getPendingSyncStatus(LEARNER).status).toBe('error');
});

it('does not retain a recovered destination in a later failed discovery snapshot', async () => {
    const job = await enqueueCredential();
    await pendingContractSyncStore.set.setFailedContractUris(job.id, [CONTRACT]);
    await pendingContractSyncStore.set.setFailedContractUris(job.id, ['contract-b']);
    await exhaustRetries(job.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('ready');
    expect(getPendingSyncStatus(LEARNER, 'contract-b').status).toBe('error');
});

it('keeps an unrelated partner ready after newer completed contract jobs are pruned', async () => {
    const failed = await enqueueCredential();
    await pendingContractSyncStore.set.setFailedContractUris(failed.id, [CONTRACT]);
    await exhaustRetries(failed.id);
    vi.setSystemTime(2000);
    const unrelated = await enqueueContract('contract-b');
    await pendingContractSyncStore.set.markDone(unrelated.id);
    vi.setSystemTime(2000 + DONE_JOB_TTL_MS + 1);
    await pendingContractSyncStore.set.pruneDoneJobs();
    expect(pendingContractSyncStore.get.jobs()[failed.id].status).toBe('error');
    expect(getPendingSyncStatus(LEARNER, 'contract-b').status).toBe('ready');
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('error');
});

it('keeps pending key-DID uploads visible after the same wallet resolves its network profile', async () => {
    const keyDid = 'did:key:learner';
    const networkDid = 'did:web:network.example:users:learner';
    identity.walletDid = keyDid;
    const job = await enqueueCredential(keyDid);
    identity.walletDid = networkDid;
    expect(getPendingSyncStatus(networkDid, CONTRACT).status).toBe('syncing');
    expect(getPendingSyncStatus('did:web:network.example:users:other', CONTRACT).status).toBe(
        'ready'
    );
    await pendingContractSyncStore.set.claimJob(job.id);
    await pendingContractSyncStore.set.setTotals(job.id, 1);
    await pendingContractSyncStore.set.recordCredentialSynced(job.id, 'Achievement', 'shared-uri');
    await pendingContractSyncStore.set.markDone(job.id);
    expect(getPendingSyncStatus(networkDid)).toMatchObject({
        status: 'ready',
        progress: { totalCredentials: 1, completedCredentials: 1 },
    });
});

it('does not expose personal key-DID jobs to a switched profile or another wallet key', async () => {
    await enqueueCredential('did:key:learner');
    identity.walletDid = 'did:web:network.example:users:organization';
    identity.switchedDid = identity.walletDid;
    expect(getPendingSyncStatus(identity.walletDid, CONTRACT).status).toBe('ready');
    identity.switchedDid = undefined;
    identity.keyDid = 'did:key:another-wallet';
    expect(getPendingSyncStatus(identity.walletDid, CONTRACT).status).toBe('ready');
});
