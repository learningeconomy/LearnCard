// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('BroadcastChannel', undefined);
    localStorage.clear();
});
afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

it('preserves legacy retry checkpoints across reload without resurrecting removed jobs', async () => {
    const record = { id: 'saved', uri: 'credential:legacy', category: 'Achievement' };
    const profileDid = 'did:example:legacy-learner';
    const id = ['credential', profileDid, 'Achievement', record.uri].join('::');
    const legacy = {
        id,
        kind: 'credential',
        profileDid,
        record,
        category: 'Achievement',
        status: 'error',
        retryCount: 2,
        totalCredentials: 1,
        processedCredentials: 1,
        completedCredentials: 0,
        failedCredentials: 1,
        syncedSharedUrisByCategory: {},
        syncedTermsUris: ['terms:acknowledged'],
        failedContractUris: ['contract:failed'],
        lastError: 'Sharing failed',
        createdAt: 1,
        updatedAt: 2,
        finishedAt: 2,
    };
    localStorage.setItem(
        'pendingContractSyncStore',
        JSON.stringify({ state: { jobs: { [id]: legacy } } })
    );
    const initial = await import('./pendingContractSyncStore');
    await initial.hydratePendingContractSyncJobs();
    expect(initial.pendingContractSyncStore.get.jobs()[id]).toEqual(legacy);

    vi.resetModules();
    const reloaded = await import('./pendingContractSyncStore');
    await reloaded.hydratePendingContractSyncJobs();
    expect(reloaded.pendingContractSyncStore.get.jobs()[id]).toEqual(legacy);
    await reloaded.clearPendingContractSyncJob(id);

    // The source is removed only after its jobs and migration state are durable.
    expect(localStorage.getItem('pendingContractSyncStore')).toBeNull();
    vi.resetModules();
    const afterRemoval = await import('./pendingContractSyncStore');
    await afterRemoval.hydratePendingContractSyncJobs();
    expect(afterRemoval.pendingContractSyncStore.get.jobs()[id]).toBeUndefined();
});

const legacyContractJob = (id: string) => ({
    id,
    kind: 'contract',
    profileDid: 'did:example:profile',
    contractUri: `contract:${id}`,
    termsUri: `terms:${id}`,
    ownerDid: 'did:example:owner',
    status: 'queued',
    retryCount: 0,
    totalCredentials: 0,
    processedCredentials: 0,
    completedCredentials: 0,
    failedCredentials: 0,
    syncedSharedUrisByCategory: {},
    createdAt: 1,
    updatedAt: 1,
});

it('imports late legacy jobs without overwriting or resurrecting durable jobs', async () => {
    const store = await import('./pendingContractSyncStore');
    await store.hydratePendingContractSyncJobs();
    const id = 'late-job';
    const legacy = legacyContractJob(id);
    const writeLegacyAndWait = async (job: typeof legacy): Promise<void> => {
        localStorage.setItem(
            'pendingContractSyncStore',
            JSON.stringify({ state: { jobs: { [id]: job } } })
        );
        await store.hydratePendingContractSyncJobs();
        expect(localStorage.getItem('pendingContractSyncStore')).toBeNull();
    };
    await writeLegacyAndWait(legacy);
    expect(store.pendingContractSyncStore.get.jobs()[id]).toEqual(legacy);

    await store.pendingContractSyncStore.set.setTotals(id, 42);
    await writeLegacyAndWait({ ...legacy, updatedAt: 100, totalCredentials: 999 });
    const durable = store.pendingContractSyncStore.get.jobs()[id];
    expect(durable?.totalCredentials).toBe(42);
    expect(durable?.updatedAt).not.toBe(100);

    await store.clearPendingContractSyncJob(id);
    await writeLegacyAndWait(legacy);
    expect(store.pendingContractSyncStore.get.jobs()[id]).toBeUndefined();
    const newDelivery = { ...legacy, updatedAt: Date.now() + 1 };
    await writeLegacyAndWait(newDelivery);
    expect(store.pendingContractSyncStore.get.jobs()[id]).toEqual(newDelivery);
});

it('does not remove a legacy map that changes while its jobs are being imported', async () => {
    const store = await import('./pendingContractSyncStore');
    await store.hydratePendingContractSyncJobs();
    const original = JSON.stringify({ state: { jobs: {} } });
    const raced = JSON.stringify({ state: { jobs: { newer: legacyContractJob('newer') } } });
    localStorage.setItem('pendingContractSyncStore', original);
    let compareResolve!: () => void;
    const compareComplete = new Promise<void>(resolve => {
        compareResolve = resolve;
    });
    const originalGetItem = localStorage.getItem.bind(localStorage);
    let reads = 0;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => {
        const value = originalGetItem(key);
        if (key === 'pendingContractSyncStore' && ++reads === 2) {
            localStorage.setItem(key, raced);
            compareResolve();
            return raced;
        }
        return value;
    });
    window.dispatchEvent(new StorageEvent('storage', { key: 'pendingContractSyncStore' }));
    await compareComplete;
    expect(localStorage.getItem('pendingContractSyncStore')).toBe(raced);
    vi.restoreAllMocks();
    await store.hydratePendingContractSyncJobs();
    expect(store.pendingContractSyncStore.get.jobs().newer).toEqual(legacyContractJob('newer'));
});

it('imports a legacy storage event snapshot even if another tab already removed the source key', async () => {
    const store = await import('./pendingContractSyncStore');
    await store.hydratePendingContractSyncJobs();
    const job = legacyContractJob('event-only');
    window.dispatchEvent(
        new StorageEvent('storage', {
            key: 'pendingContractSyncStore',
            newValue: JSON.stringify({ state: { jobs: { [job.id]: job } } }),
        })
    );
    await vi.waitFor(() => expect(store.pendingContractSyncStore.get.jobs()[job.id]).toEqual(job));
    expect(localStorage.getItem('pendingContractSyncStore')).toBeNull();
});
