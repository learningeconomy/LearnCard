import type { CredentialFactsSource } from '../credentialFactsLoader';

const did = 'did:example:learner';
const vc = { type: ['VerifiableCredential', 'ClrCredential'], issuer: 'did:example:pilot' };

const sourceFor = (count: number): CredentialFactsSource => ({
    list: vi.fn(async () =>
        Array.from({ length: count }, (_, i) => ({
            uri: `lc:${i}`,
            category: 'Learning History',
        }))
    ),
    cached: vi.fn().mockReturnValue(undefined),
    read: vi.fn().mockResolvedValue(vc),
    isActive: () => true,
});

describe('credential facts backfill', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('limits concurrent reads to four and stops at 200, then completes in a later session', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const store = await import('../credentialFactsStore');
        const loader = createCredentialFactsLoader(did);
        const source = sourceFor(205);
        let concurrent = 0;
        let peak = 0;
        source.read = vi.fn(async () => {
            concurrent += 1;
            peak = Math.max(peak, concurrent);
            await new Promise(resolve => setTimeout(resolve, 0));
            concurrent -= 1;
            return vc;
        });
        await loader.refresh(source);
        expect(source.read).toHaveBeenCalledTimes(200);
        expect(peak).toBe(4);
        expect(loader.getSnapshot()).toMatchObject({ complete: false, total: 205, readsUsed: 200 });
        const saved = await store.loadCredentialFacts(did);
        // A new module session resets the decrypt budget, while persisted summaries survive.
        vi.resetModules();
        const nextStore = await import('../credentialFactsStore');
        await Promise.all(saved.map(fact => nextStore.saveCredentialFact(did, fact)));
        const { createCredentialFactsLoader: createNextLoader } =
            await import('../credentialFactsLoader');
        const next = createNextLoader(did);
        const nextSource = sourceFor(205);
        await next.refresh(nextSource);
        expect(nextSource.read).toHaveBeenCalledTimes(5);
        expect(next.getSnapshot()).toMatchObject({ complete: true, total: 205, readsUsed: 5 });
        const cold = createNextLoader(did);
        const coldSource = sourceFor(205);
        await cold.refresh(coldSource);
        expect(coldSource.read).not.toHaveBeenCalled();
        expect(cold.getSnapshot().complete).toBe(true);
    });

    it('reuses resolved query data without spending the decrypt budget', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const loader = createCredentialFactsLoader(did);
        const source = sourceFor(6);
        source.cached = () => vc;
        await loader.refresh(source);
        expect(source.read).not.toHaveBeenCalled();
        expect(loader.getSnapshot()).toMatchObject({ complete: true, readsUsed: 0 });
    });

    it('enforces the session decrypt budget during a forced backfill', async () => {
        const { createCredentialFactsLoader, MAX_SESSION_DECRYPTS } =
            await import('../credentialFactsLoader');
        const loader = createCredentialFactsLoader(did);
        const source = sourceFor(MAX_SESSION_DECRYPTS + 5);

        await loader.refresh(source, true);

        expect(source.read).toHaveBeenCalledTimes(MAX_SESSION_DECRYPTS);
        expect(loader.getSnapshot()).toMatchObject({
            complete: false,
            total: MAX_SESSION_DECRYPTS + 5,
            readsUsed: MAX_SESSION_DECRYPTS,
        });
    });

    it('shares concurrent refreshes, throttles resumes, and removes missing credentials', async () => {
        const { getCredentialFactsLoader } = await import('../credentialFactsLoader');
        const loader = getCredentialFactsLoader(did);
        expect(getCredentialFactsLoader(did)).toBe(loader);
        const source = sourceFor(2);
        await Promise.all([loader.refresh(source), loader.refresh(source)]);
        expect(source.read).toHaveBeenCalledTimes(2);
        await loader.refresh(source);
        expect(source.list).toHaveBeenCalledTimes(1);
        source.list = vi.fn().mockResolvedValue([{ uri: 'lc:1', category: 'Achievement' }]);
        await loader.refresh(source, true);
        expect(loader.getSnapshot()).toMatchObject({ total: 1, complete: true });
        expect(loader.getSnapshot().summaries?.[0]).toMatchObject({
            uri: 'lc:1',
            category: 'Achievement',
        });
        expect(source.read).toHaveBeenCalledTimes(2);
    });

    it('retains claims arriving during backfill and rejects results after stopping', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const { addCredentialSummary, loadCredentialFacts } =
            await import('../credentialFactsStore');
        const loader = createCredentialFactsLoader(did);
        const release = loader.acquire();
        let finish: (value: unknown) => void = () => undefined;
        const source = sourceFor(1);
        source.read = vi.fn(
            () =>
                new Promise(resolve => {
                    finish = resolve;
                })
        );
        const refresh = loader.refresh(source);
        await vi.waitFor(() => expect(source.read).toHaveBeenCalledOnce());
        await addCredentialSummary(did, 'lc:claim', vc, 'Achievement');
        finish(vc);
        await refresh;
        expect(loader.getSnapshot().summaries?.map(s => s.uri)).toContain('lc:claim');
        release();
        const other = createCredentialFactsLoader('did:example:other');
        const late = other.refresh(source);
        await vi.waitFor(() => expect(source.read).toHaveBeenCalledTimes(2));
        other.stop();
        finish(vc);
        await late;
        expect(await loadCredentialFacts('did:example:other')).toEqual([]);
        expect(other.getSnapshot().summaries).toBeNull();
    });

    it('fails closed on index errors and retries unreadable credentials only when forced', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const loader = createCredentialFactsLoader(did);
        const source = sourceFor(1);
        source.read = vi.fn().mockRejectedValue(new Error('unreadable'));
        await expect(loader.refresh(source)).resolves.toBeUndefined();
        expect(loader.getSnapshot().complete).toBe(false);
        source.read = vi.fn().mockResolvedValue(vc);
        await loader.refresh(source, true);
        expect(loader.getSnapshot().complete).toBe(true);
        source.list = vi.fn().mockRejectedValue(new Error('offline'));
        await loader.refresh(source, true);
        expect(loader.getSnapshot().complete).toBe(false);
    });

    it('keeps facts incomplete when a decrypted value is malformed', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const { loadCredentialFacts } = await import('../credentialFactsStore');
        const loader = createCredentialFactsLoader(did);
        const source = sourceFor(1);

        source.read = vi.fn().mockResolvedValue({});
        await loader.refresh(source);

        expect(loader.getSnapshot()).toMatchObject({ complete: false, total: 1 });
        expect(await loadCredentialFacts(did)).toEqual([]);
    });
});
