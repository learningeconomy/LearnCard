import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
    enqueuePendingContractSync,
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
const exhaustRetries = (id: string) => {
    for (let attempt = 0; attempt < MAX_JOB_RETRIES; attempt += 1) {
        pendingContractSyncStore.set.markRunning(id);
        pendingContractSyncStore.set.markError(id, 'Sharing failed');
    }
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    pendingContractSyncStore.set.jobs({});
});
afterEach(() => vi.useRealTimers());

it('keeps contract-scoped status syncing while account credential delivery is queued, running or retrying', () => {
    const job = enqueueCredential();
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('syncing');
    pendingContractSyncStore.set.markRunning(job.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('syncing');
    pendingContractSyncStore.set.markError(job.id, 'Offline');
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('syncing');
    pendingContractSyncStore.set.markDone(job.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('ready');
});

it('excludes other profiles and unrelated contract jobs from scoped status', () => {
    enqueueCredential('did:example:other');
    enqueueContract(CONTRACT, 'did:example:other');
    enqueueContract('contract-b');
    expect(getPendingSyncStatus(LEARNER, CONTRACT)).toMatchObject({
        status: 'ready',
        progress: { totalCredentials: 0, completedCredentials: 0, retryCount: 0 },
    });
    expect(getPendingSyncStatus(LEARNER).status).toBe('syncing');
    expect(getPendingSyncStatus(undefined).status).toBe('ready');
});

it('keeps unattributed exhausted delivery errors global without poisoning scoped partners', async () => {
    const job = enqueueCredential();
    exhaustRetries(job.id);
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

it('does not let completed discovery hide a failure for the requested contract', () => {
    const contract = enqueueContract();
    exhaustRetries(contract.id);
    vi.setSystemTime(2000);
    const credential = enqueueCredential();
    pendingContractSyncStore.set.markDone(credential.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT)).toMatchObject({
        status: 'error',
        lastError: 'Sharing failed',
    });
});

it('waits for queued credential delivery before telling a partner that its contract is ready', async () => {
    const job = enqueueCredential();
    let settled = false;
    const waiting = waitForPendingSync(LEARNER, CONTRACT, 2000).then(result => {
        settled = true;
        return result;
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(settled).toBe(false);
    pendingContractSyncStore.set.markDone(job.id);
    await vi.advanceTimersByTimeAsync(500);
    expect(await waiting).toMatchObject({ status: 'ready' });
});

it('returns syncing when the wait deadline expires without delivery', async () => {
    enqueueCredential();
    const waiting = waitForPendingSync(LEARNER, CONTRACT, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await waiting).toMatchObject({ status: 'syncing' });
});

it('restores failed destinations and reports terminal errors only to the affected partner', async () => {
    const job = enqueueCredential();
    pendingContractSyncStore.set.setFailedContractUris(job.id, [CONTRACT]);
    exhaustRetries(job.id);
    const persisted = JSON.parse(localStorage.getItem('pendingContractSyncStore')!);
    pendingContractSyncStore.set.jobs(persisted.state.jobs);
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

it('does not retain a recovered destination in a later failed discovery snapshot', () => {
    const job = enqueueCredential();
    pendingContractSyncStore.set.setFailedContractUris(job.id, [CONTRACT]);
    pendingContractSyncStore.set.setFailedContractUris(job.id, ['contract-b']);
    exhaustRetries(job.id);
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('ready');
    expect(getPendingSyncStatus(LEARNER, 'contract-b').status).toBe('error');
});

it('keeps an unrelated partner ready after newer completed contract jobs are pruned', () => {
    const failed = enqueueCredential();
    pendingContractSyncStore.set.setFailedContractUris(failed.id, [CONTRACT]);
    exhaustRetries(failed.id);
    vi.setSystemTime(2000);
    const unrelated = enqueueContract('contract-b');
    pendingContractSyncStore.set.markDone(unrelated.id);
    vi.setSystemTime(2000 + DONE_JOB_TTL_MS + 1);
    pendingContractSyncStore.set.pruneDoneJobs();
    expect(pendingContractSyncStore.get.jobs()[failed.id].status).toBe('error');
    expect(getPendingSyncStatus(LEARNER, 'contract-b').status).toBe('ready');
    expect(getPendingSyncStatus(LEARNER, CONTRACT).status).toBe('error');
});
