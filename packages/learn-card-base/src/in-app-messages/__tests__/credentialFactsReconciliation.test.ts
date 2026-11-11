import type { CredentialFactsSource } from '../credentialFactsLoader';

const storage = vi.hoisted(() => ({
    values: new Map<string, unknown>(),
    pendingSave: undefined as Promise<void> | undefined,
    pendingRemoval: undefined as Promise<void> | undefined,
    writable: true,
    setItem: vi.fn(),
    removeItem: vi.fn(),
}));

vi.mock('localforage', () => ({
    default: {
        INDEXEDDB: 'indexeddb',
        createInstance: () => ({
            keys: async () => [...storage.values.keys()],
            getItem: async (key: string) => storage.values.get(key),
            setItem: storage.setItem,
            removeItem: storage.removeItem,
        }),
    },
}));

const deferred = <T>() => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(finish => {
        resolve = finish;
    });
    return { promise, resolve };
};

describe('credential fact reconciliation', () => {
    beforeEach(() => {
        vi.resetModules();
        storage.values.clear();
        storage.pendingSave = undefined;
        storage.pendingRemoval = undefined;
        storage.writable = true;
        storage.setItem.mockReset().mockImplementation(async (key: string, value: unknown) => {
            await storage.pendingSave;
            if (!storage.writable) throw new Error('IndexedDB unavailable');
            storage.values.set(key, value);
            return value;
        });
        storage.removeItem.mockReset().mockImplementation(async (key: string) => {
            await storage.pendingRemoval;
            storage.values.delete(key);
        });
    });

    it.each([true, false])(
        'retains a claim whose save overlaps an older index response (IndexedDB writable: %s)',
        async writable => {
            const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
            const store = await import('../credentialFactsStore');
            const reconcile = vi.spyOn(store, 'removeMissingCredentialFacts');
            const did = 'did:example:alice';
            const vc = { type: ['VerifiableCredential'], issuer: 'did:issuer:a' };
            await store.addCredentialSummary(did, 'lc:removed', vc);
            const loader = createCredentialFactsLoader(did);
            const release = loader.acquire();
            const index = deferred<Awaited<ReturnType<CredentialFactsSource['list']>>>();
            const source: CredentialFactsSource = {
                list: vi.fn(() => index.promise),
                cached: () => undefined,
                read: vi.fn().mockResolvedValue(vc),
                isActive: () => true,
            };
            const refresh = loader.refresh(source);
            await vi.waitFor(() => expect(source.list).toHaveBeenCalledOnce());

            const save = deferred<void>();
            const removal = deferred<void>();
            storage.pendingSave = save.promise;
            storage.pendingRemoval = removal.promise;
            storage.writable = writable;
            const claim = store.addCredentialSummary(did, 'lc:claimed', vc);
            await vi.waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(2));
            expect(loader.getSnapshot().summaries?.map(fact => fact.uri)).toEqual(['lc:removed']);

            index.resolve([]);
            await vi.waitFor(() => expect(reconcile).toHaveBeenCalledOnce());
            save.resolve();
            await claim;
            removal.resolve();
            await refresh;

            expect(loader.getSnapshot()).toMatchObject({ complete: true, total: 1 });
            expect(await store.loadCredentialFacts(did)).toEqual([
                expect.objectContaining({ uri: 'lc:claimed' }),
            ]);
            if (writable) {
                expect([...storage.values.values()]).toEqual([
                    expect.objectContaining({ uri: 'lc:claimed' }),
                ]);
            }
            release();

            const resumed = createCredentialFactsLoader(did);
            source.list = vi.fn().mockResolvedValue([{ uri: 'lc:claimed' }]);
            await resumed.refresh(source);
            expect(source.read).not.toHaveBeenCalled();
            expect(resumed.getSnapshot()).toMatchObject({ complete: true, total: 1 });
        }
    );

    it('persists a newer save after an in-flight prune of the same URI', async () => {
        const store = await import('../credentialFactsStore');
        const did = 'did:example:alice';
        const uri = 'lc:credential';
        await store.addCredentialSummary(did, uri, {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:old',
        });
        const removal = deferred<void>();
        storage.pendingRemoval = removal.promise;
        const prune = store.removeMissingCredentialFacts(did, new Set());
        await vi.waitFor(() => expect(storage.removeItem).toHaveBeenCalledOnce());

        const save = store.addCredentialSummary(did, uri, {
            type: ['VerifiableCredential'],
            issuer: 'did:issuer:new',
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        removal.resolve();
        await Promise.all([prune, save]);

        expect([...storage.values.values()]).toEqual([
            expect.objectContaining({ uri, issuer: 'did:issuer:new' }),
        ]);
        expect(await store.loadCredentialFacts(did)).toEqual([
            expect.objectContaining({ uri, issuer: 'did:issuer:new' }),
        ]);
    });
});
