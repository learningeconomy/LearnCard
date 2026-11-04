import { beforeEach, describe, expect, it, mock } from 'bun:test';

const persisted = new Map<string, string>();
let erased = false;
let failWrites = false;
let beforeWrite: (() => Promise<void>) | undefined;
const assertActive = async () => {
    if (erased) throw new Error('data_erasure_requested');
};

mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => `opaque-${did.length}`,
}));
mock.module('../services/dataErasure', () => ({
    assertOwnerOperationActive: assertActive,
    isDataErasureRequested: async () => erased,
    withOwnerOperation: async (_did: string, fn: () => Promise<unknown>) => {
        await assertActive();
        const result = await fn();
        await assertActive();
        return result;
    },
}));
mock.module('../utils/cache', () => ({
    default: {
        get: async (key: string) => persisted.get(key) ?? null,
        set: async (key: string, value: string) => {
            await beforeWrite?.();
            // Model the atomic Redis fence at write time, not at scheduling time.
            await assertActive();
            if (failWrites) throw new Error('storage_unavailable');
            persisted.set(key, value);
            return 'OK' as const;
        },
    },
}));

// Mocks must be installed before the module captures cache/privacy dependencies.
const {
    clearCredentialIngestionState,
    getCredentialIngestionState,
    isCredentialIngestionPending,
    markCredentialIngestionActive,
    markCredentialIngestionError,
    markCredentialIngestionQueued,
    markCredentialIngestionReady,
    refreshCredentialIngestionState,
    waitForCredentialIngestion,
} = await import('./credentialIngestionState');

const did = 'did:example:learner';
const metrics = {
    totalSeen: 1,
    indexed: 1,
    repaired: 0,
    alreadyComplete: 0,
    failed: 0,
    durationMs: 10,
    changed: false,
};

describe('credential ingestion readiness', () => {
    beforeEach(() => {
        persisted.clear();
        clearCredentialIngestionState(did);
        erased = failWrites = false;
        beforeWrite = undefined;
    });

    it('settles ready ingestion and preserves metrics across the next run', async () => {
        await markCredentialIngestionQueued(did, 'app_open');
        expect(isCredentialIngestionPending(did)).toBe(true);
        await markCredentialIngestionActive(did, 'app_open');
        await markCredentialIngestionReady(did, 'app_open', metrics);
        await expect(waitForCredentialIngestion(did, 0)).resolves.toMatchObject({
            phase: 'ready',
            metrics,
        });
        expect(isCredentialIngestionPending(did)).toBe(false);
        clearCredentialIngestionState(did);
        await markCredentialIngestionQueued(did, 'manual');
        expect(getCredentialIngestionState(did)).toMatchObject({
            phase: 'queued',
            metrics,
        });
    });

    it('returns pending state when the caller has no wait budget', async () => {
        await markCredentialIngestionQueued(did, 'consent');
        await expect(waitForCredentialIngestion(did, 0)).resolves.toMatchObject({
            phase: 'queued',
            source: 'consent',
        });
    });

    it('publishes a terminal error without retaining an exception', async () => {
        await markCredentialIngestionQueued(did, 'manual');
        await markCredentialIngestionError(did, 'manual');
        expect(isCredentialIngestionPending(did)).toBe(false);
        await expect(waitForCredentialIngestion(did, 0)).resolves.toMatchObject({
            phase: 'error',
        });
    });

    it('does not report ready when durable state publication failed', async () => {
        await markCredentialIngestionActive(did, 'worker');
        failWrites = true;
        await expect(markCredentialIngestionReady(did, 'worker', metrics)).rejects.toThrow(
            'storage_unavailable'
        );
        expect(getCredentialIngestionState(did)?.phase).toBe('active');
    });

    it('does not revive an erased state when an active write resumes', async () => {
        await markCredentialIngestionActive(did, 'worker');
        let resume!: () => void;
        let entered!: () => void;
        const paused = new Promise<void>(resolve => {
            entered = resolve;
        });
        beforeWrite = () => {
            entered();
            return new Promise<void>(resolve => {
                resume = resolve;
            });
        };
        const completing = markCredentialIngestionReady(did, 'worker', metrics);
        await paused;
        erased = true;
        persisted.clear();
        clearCredentialIngestionState(did);
        resume();
        await expect(completing).rejects.toThrow('data_erasure_requested');
        expect(persisted.size).toBe(0);
        expect(await refreshCredentialIngestionState(did)).toBeUndefined();
        expect(getCredentialIngestionState(did)).toBeUndefined();
    });

    it('does not serve local state after its authoritative cache entry disappears', async () => {
        await markCredentialIngestionReady(did, 'worker', metrics);
        persisted.clear();
        expect(await refreshCredentialIngestionState(did)).toBeUndefined();
        expect(getCredentialIngestionState(did)).toBeUndefined();
    });
});
