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

    // Retain the old source as a recovery backup; a fresh tab must not import it twice.
    expect(localStorage.getItem('pendingContractSyncStore')).not.toBeNull();
    vi.resetModules();
    const afterRemoval = await import('./pendingContractSyncStore');
    await afterRemoval.hydratePendingContractSyncJobs();
    expect(afterRemoval.pendingContractSyncStore.get.jobs()[id]).toBeUndefined();
});
