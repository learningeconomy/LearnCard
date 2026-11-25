import type { DataLifecycleDependencies } from './dataLifecycle';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

const owner = 'did:example:alice';
const removeJob = mock(async () => undefined);
const activeJob = {
    id: 'opaque-job',
    data: { referenceId: 'opaque-reference' },
    remove: removeJob,
    getState: async () => 'active',
};
const strictScan = mock(
    async (
        _cursor: string,
        _match: string,
        _pattern: string,
        _count: string,
        _size: number
    ): Promise<[string, string[]]> => ['0', []]
);
const strictGet = mock(async (_key: string): Promise<string | null> => null);
const strictUnlink = mock(async (..._keys: string[]) => 0);
const authenticationEntries = mock(
    async (_did: string): Promise<{ key: string; value: unknown }[]> => []
);
mock.module('./ownerAuthIndex', () => ({
    readOwnerAuthenticationEntries: authenticationEntries,
    deleteOwnerAuthenticationEntries: async () => 0,
}));
mock.module('../learncard/external-artifact-deletion', () => ({
    cleanupExternalArtifacts: async () => ({
        complete: true,
        retryable: false,
        artifacts: [],
    }),
}));
mock.module('../db', () => ({
    db: {
        fenceOwnerWrites: async () => undefined,
        getExternalArtifacts: async () => [],
        getOwnerJobReferences: async () => [
            { referenceId: 'opaque-reference', queue: 'credential-ingestion' },
        ],
    },
}));
mock.module('../db/qdrant', () => ({
    deleteOwnerVectors: async () => [],
    exportOwnerVectors: async () => ({}),
}));
mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => `subject:${did}`,
}));
mock.module('../utils/cache', () => ({
    default: {
        redis: { scan: strictScan, get: strictGet, unlink: strictUnlink },
    },
}));
mock.module('../workers/credentialIngestion', () => ({
    queue: { getJobs: async () => [activeJob] },
}));
mock.module('../workers/conversationSummary', () => ({
    summaryQueue: { getJobs: async () => [] },
}));
mock.module('../workers/ownerJobs', () => ({
    getOwnerJobRecord: async () => ({
        did: owner,
        queue: 'credential-ingestion',
        payload: { source: 'queue' },
    }),
}));
mock.module('../workers/credentialIngestionState', () => ({
    clearCredentialIngestionState: () => undefined,
}));
mock.module('./dataErasure', () => ({
    requestDataErasure: async () => ({ requestedAt: '2026-09-10T00:00:00.000Z' }),
    completeDataErasure: async () => ({
        completedAt: '2026-09-10T01:00:00.000Z',
    }),
    closeOwnerSockets: () => undefined,
    getActiveOwnerOperationCount: async () => 0,
}));

// Import after boundary doubles to avoid loading real worker/database connections.
const {
    clearOwnerProcessState,
    createDataLifecycleService,
    dataLifecycleService,
    deleteOwnerCacheEntries,
    exportOwnerCacheEntries,
} = await import('./dataLifecycle');
const { prefetchConsentSnapshot, reuseRequestConsentRead, runWithLearnCardRequestScope } =
    await import('../learncard/requestScope');
const { getVerifiedCredential, rememberVerifiedCredential } = await import('../credentials/batch');

const fixture = (overrides: Partial<DataLifecycleDependencies> = {}) =>
    createDataLifecycleService({
        exportMongo: async () => ({}),
        deleteMongo: async () => ({}),
        fenceOwnerWrites: async () => undefined,
        externalArtifacts: async () => [],
        exportVectors: async () => [],
        deleteVectors: async () => [],
        exportCache: exportOwnerCacheEntries,
        deleteCache: deleteOwnerCacheEntries,
        deleteAuthentication: async () => 0,
        cleanupArtifacts: async () => ({
            complete: true,
            retryable: false,
            artifacts: [],
        }),
        completeErasure: async () => ({ completedAt: '2026-09-10T01:00:00.000Z' }),
        exportJobs: async () => [],
        deleteJobs: async () => ({ removed: 0, pending: [] }),
        requestErasure: async () => ({ requestedAt: '2026-09-10T00:00:00.000Z' }),
        closeOwnerSockets: () => undefined,
        activeOwnerOperations: async () => 0,
        subjectRef: did => `subject:${did}`,
        now: () => new Date('2026-09-10T01:00:00.000Z'),
        ...overrides,
    });

beforeEach(() => {
    strictScan.mockReset();
    strictScan.mockResolvedValue(['0', []]);
    strictGet.mockReset();
    strictGet.mockResolvedValue(null);
    strictUnlink.mockReset();
    strictUnlink.mockResolvedValue(0);
    removeJob.mockClear();
    authenticationEntries.mockReset();
    authenticationEntries.mockResolvedValue([]);
});

describe('owner data lifecycle', () => {
    test('export rejects authoritative Redis scan and read failures', async () => {
        strictScan.mockRejectedValueOnce(new Error('scan unavailable'));
        await expect(fixture().exportData(owner)).rejects.toThrow('scan unavailable');
        strictScan.mockResolvedValue(['0', [`topics:subject:${owner}:cached`]]);
        strictGet.mockRejectedValueOnce(new Error('read unavailable'));
        await expect(fixture().exportData(owner)).rejects.toThrow('read unavailable');
    });

    test('cache export strips indexed authentication secrets', async () => {
        authenticationEntries.mockResolvedValue([
            {
                key: 'oauth:refresh:alice-secret',
                value: {
                    did: owner,
                    clientId: 'alice-client',
                    token: 'private-refresh',
                },
            },
        ]);
        expect(await exportOwnerCacheEntries(owner)).toEqual([
            { type: 'oauth-refresh-token', clientId: 'alice-client' },
        ]);
        authenticationEntries.mockRejectedValueOnce(new Error('index unavailable'));
        await expect(exportOwnerCacheEntries(owner)).rejects.toThrow('index unavailable');
    });

    test('an active private job is pending without removal or discard', async () => {
        const result = await dataLifecycleService.deleteData(owner);
        expect(result.status).toBe('incomplete');
        expect(result).toMatchObject({
            jobs: { pending: [{ id: 'opaque-job', state: 'active' }] },
            retryable: true,
        });
        expect(removeJob).not.toHaveBeenCalled();
    });

    test('Mongo fencing must finish before any cleanup can run', async () => {
        let releaseFence!: () => void;
        let enteredFence!: () => void;
        const entered = new Promise<void>(resolve => {
            enteredFence = resolve;
        });
        const fenced = new Promise<void>(resolve => {
            releaseFence = resolve;
        });
        let tombstoned = false;
        let cleaned = false;
        const service = fixture({
            requestErasure: async () => {
                tombstoned = true;
                return { requestedAt: '2026-09-10T00:00:00.000Z' };
            },
            fenceOwnerWrites: async () => {
                expect(tombstoned).toBe(true);
                enteredFence();
                await fenced;
            },
            deleteJobs: async () => {
                cleaned = true;
                return { removed: 0, pending: [] };
            },
        });
        const deleting = service.deleteData(owner);
        await entered;
        expect(cleaned).toBe(false);
        releaseFence();
        expect((await deleting).status).toBe('complete');
    });

    test('live operations preserve data and authentication until a retry drains', async () => {
        let active = 1;
        let dataPresent = true;
        let authenticated = true;
        const service = fixture({
            activeOwnerOperations: async () => active,
            deleteMongo: async () => {
                dataPresent = false;
                return {};
            },
            deleteAuthentication: async () => {
                authenticated = false;
                return 1;
            },
        });
        expect((await service.deleteData(owner)).status).toBe('incomplete');
        expect(dataPresent).toBe(true);
        expect(authenticated).toBe(true);
        active = 0;
        expect((await service.deleteData(owner)).status).toBe('complete');
        expect(dataPresent).toBe(false);
        expect(authenticated).toBe(false);
    });

    for (const failingStore of ['vectors', 'cache', 'mongo'] as const) {
        test(`retry preserves external evidence and finishes after partial ${failingStore} failure`, async () => {
            const artifacts = [
                {
                    operationId: 'reserved',
                    credentialId: 'urn:uuid:credential',
                    status: 'complete',
                    uris: [],
                    deletion: { status: 'deleted' },
                },
            ];
            let failing = true;
            let vectorsPresent = true;
            let mongoPresent = true;
            let authenticated = true;
            const service = fixture({
                externalArtifacts: async () => artifacts,
                cleanupArtifacts: async () => ({
                    complete: true,
                    retryable: false,
                    artifacts,
                }),
                deleteVectors: async () => {
                    if (failing && failingStore === 'vectors')
                        throw new Error('private infrastructure error');
                    vectorsPresent = false;
                    return ['credentials'];
                },
                deleteCache: async () => {
                    if (failing && failingStore === 'cache')
                        throw new Error('private infrastructure error');
                    return 1;
                },
                deleteMongo: async () => {
                    expect(vectorsPresent).toBe(false);
                    mongoPresent = false; // A partial Mongo failure may already have deleted owner rows.
                    if (failing && failingStore === 'mongo')
                        throw new Error('private infrastructure error');
                    return { deleted: { credentials: 1 } };
                },
                deleteAuthentication: async () => {
                    authenticated = false;
                    return 1;
                },
            });
            const first = await service.deleteData(owner);
            expect(first).toMatchObject({
                status: 'incomplete',
                retryable: true,
                failedStage: failingStore,
                externalArtifacts: artifacts,
            });
            expect(JSON.stringify(first)).not.toContain('private infrastructure error');
            expect(authenticated).toBe(true);
            if (failingStore !== 'mongo') expect(mongoPresent).toBe(true);
            failing = false;
            const retry = await service.deleteData(owner);
            expect(retry).toMatchObject({
                status: 'complete',
                externalArtifacts: artifacts,
            });
            expect(mongoPresent).toBe(false);
            expect(authenticated).toBe(false);
        });
    }

    test('remote uncertainty retains authentication and the durable request until cleanup succeeds', async () => {
        let remoteComplete = false;
        let authenticated = true;
        let queued = true;
        const artifacts = [{ status: 'unknown', uris: [], deletion: { status: 'unknown' } }];
        const service = fixture({
            cleanupArtifacts: async () => ({
                complete: remoteComplete,
                retryable: false,
                artifacts,
            }),
            deleteAuthentication: async () => {
                authenticated = false;
                return 1;
            },
            completeErasure: async () => {
                queued = false;
                return { completedAt: '2026-09-10T01:00:00.000Z' };
            },
        });
        const first = await service.deleteData(owner);
        expect(first).toMatchObject({
            status: 'incomplete',
            retryable: false,
            failedStage: 'external-artifacts',
            externalArtifacts: artifacts,
        });
        expect(first).not.toHaveProperty('completedAt');
        expect(authenticated).toBe(true);
        expect(queued).toBe(true);
        remoteComplete = true;
        expect((await service.deleteData(owner)).status).toBe('complete');
        expect(authenticated).toBe(false);
        expect(queued).toBe(false);
    });

    test('Redis unlink failure cannot produce complete deletion', async () => {
        strictScan.mockResolvedValue(['0', [`topics:subject:${owner}:cached`]]);
        strictGet.mockResolvedValue(JSON.stringify({ did: owner }));
        strictUnlink.mockRejectedValueOnce(new Error('unlink failed'));
        expect(await fixture().deleteData(owner)).toMatchObject({
            status: 'incomplete',
            failedStage: 'cache',
            retryable: true,
        });
    });
});

test("erasure drops the learner's verified credentials and leaves other learners' alone", () => {
    rememberVerifiedCredential(owner, 'uri:1', 'rev', 'mine');
    rememberVerifiedCredential('did:example:bob', 'uri:1', 'rev', 'bob');

    // dataLifecycleService's cache stage runs this after unlinking Redis entries.
    clearOwnerProcessState(owner);

    expect(getVerifiedCredential<string>(owner, 'uri:1', 'rev')).toBeUndefined();
    expect(getVerifiedCredential<string>('did:example:bob', 'uri:1', 'rev')).toBe('bob');
});

test("erasure clears the learner's consent snapshot and leaves other learners' alone", async () => {
    let reads = 0;
    const read = async () => {
        reads += 1;
        return `consent-${reads}`;
    };
    await prefetchConsentSnapshot(owner, 'contract:a', read);
    await prefetchConsentSnapshot('did:example:bob', 'contract:a', read);
    const plain = (did: string) =>
        runWithLearnCardRequestScope({}, () =>
            reuseRequestConsentRead(did, read, {
                snapshot: { contract: 'contract:a', read },
            })
        );
    expect(await plain(owner)).toBe('consent-1');
    expect(reads).toBe(2);

    // dataLifecycleService's cache stage runs this after unlinking Redis entries.
    clearOwnerProcessState(owner);

    expect(await plain(owner)).toBe('consent-3');
    expect(await plain('did:example:bob')).toBe('consent-2');
    expect(reads).toBe(3);
});
