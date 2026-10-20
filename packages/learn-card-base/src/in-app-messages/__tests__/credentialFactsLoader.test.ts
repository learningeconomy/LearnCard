import type { CredentialFactsSource } from '../credentialFactsLoader';
import type { CredentialSummary } from '../credentialFacts';

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

    it('enriches a legacy summary with its name during a forced backfill', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const { saveCredentialFact } = await import('../credentialFactsStore');
        const legacySummary = {
            uri: 'lc:legacy',
            category: 'Learning History',
            types: ['VerifiableCredential'],
            issuer: 'did:example:pilot',
            nestedIssuers: [],
            achievementTypes: [],
            issuedAt: null,
        } as CredentialSummary;
        await saveCredentialFact(did, legacySummary);
        const loader = createCredentialFactsLoader(did);
        const source = sourceFor(1);
        source.list = vi
            .fn()
            .mockResolvedValue([{ uri: 'lc:legacy', category: 'Learning History' }]);
        source.read = vi.fn().mockResolvedValue({
            ...vc,
            name: 'Legacy credential name',
        });

        await loader.refresh(source, true);

        expect(source.read).toHaveBeenCalledOnce();
        expect(loader.getSnapshot().summaries?.[0]?.name).toBe('Legacy credential name');
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
        source.list = vi
            .fn()
            .mockResolvedValue([
                { uri: 'lc:1', category: 'Achievement', title: 'Updated credential name' },
            ]);
        await loader.refresh(source, true);
        expect(loader.getSnapshot()).toMatchObject({ total: 1, complete: true });
        expect(loader.getSnapshot().summaries?.[0]).toMatchObject({
            uri: 'lc:1',
            name: 'Updated credential name',
            category: 'Achievement',
        });
        expect(source.read).toHaveBeenCalledTimes(2);
    });

    it.each(['index', 'credential'] as const)(
        'resumes an active consumer when the shared owner unmounts during the %s read',
        async phase => {
            const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
            const loader = createCredentialFactsLoader(did);
            const releaseOwner = loader.acquire();
            const releaseHost = loader.acquire();
            let ownerActive = true;
            let finish = (): void => undefined;
            const pending = new Promise<void>(resolve => {
                finish = resolve;
            });
            const owner = sourceFor(1);
            const host = sourceFor(1);
            owner.isActive = () => ownerActive;
            if (phase === 'index') {
                owner.list = vi.fn(async () => {
                    await pending;
                    return [{ uri: 'lc:0', category: 'Learning History' }];
                });
            } else {
                owner.read = vi.fn(async () => {
                    await pending;
                    return vc;
                });
            }
            const ownerRefresh = loader.refresh(owner);
            await vi.waitFor(() =>
                expect(phase === 'index' ? owner.list : owner.read).toHaveBeenCalledOnce()
            );
            expect(loader.getSnapshot()).toMatchObject({ summaries: [], complete: false });
            const hostRefresh = loader.refresh(host);

            ownerActive = false;
            releaseOwner();
            finish();
            await Promise.all([ownerRefresh, hostRefresh]);

            expect(host.list).toHaveBeenCalledOnce();
            expect(host.read).toHaveBeenCalledOnce();
            expect(loader.getSnapshot()).toMatchObject({
                complete: true,
                total: 1,
                readsUsed: phase === 'index' ? 1 : 2,
            });
            releaseHost();
        }
    );

    it('lets an active waiter resume a canceled forced refresh despite an earlier throttle', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const loader = createCredentialFactsLoader(did);
        const releaseOwner = loader.acquire();
        const releaseHost = loader.acquire();
        await loader.refresh(sourceFor(0));
        let ownerActive = true;
        let finish = (): void => undefined;
        const pending = new Promise<void>(resolve => {
            finish = resolve;
        });
        const owner = sourceFor(1);
        owner.isActive = () => ownerActive;
        owner.list = vi.fn(async () => {
            await pending;
            return [{ uri: 'lc:0' }];
        });
        const host = sourceFor(1);
        const ownerRefresh = loader.refresh(owner, true);
        await vi.waitFor(() => expect(owner.list).toHaveBeenCalledOnce());
        const hostRefresh = loader.refresh(host);

        ownerActive = false;
        releaseOwner();
        finish();
        await Promise.all([ownerRefresh, hostRefresh]);

        expect(host.list).toHaveBeenCalledOnce();
        expect(loader.getSnapshot()).toMatchObject({ complete: true, total: 1, readsUsed: 1 });
        releaseHost();
    });

    it.each(['index', 'credential'] as const)(
        'does not restart a shared refresh just because its %s read failed',
        async phase => {
            const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
            const loader = createCredentialFactsLoader(did);
            const releaseOwner = loader.acquire();
            const releaseHost = loader.acquire();
            let fail = (_error: Error): void => undefined;
            const pending = new Promise<never>((_resolve, reject) => {
                fail = reject;
            });
            const owner = sourceFor(1);
            if (phase === 'index') owner.list = vi.fn(() => pending);
            else owner.read = vi.fn(() => pending);
            const host = sourceFor(1);
            const ownerRefresh = loader.refresh(owner);
            await vi.waitFor(() =>
                expect(phase === 'index' ? owner.list : owner.read).toHaveBeenCalledOnce()
            );
            const hostRefresh = loader.refresh(host);
            fail(new Error('unreadable'));
            await Promise.all([ownerRefresh, hostRefresh]);

            expect(host.list).not.toHaveBeenCalled();
            expect(host.read).not.toHaveBeenCalled();
            expect(loader.getSnapshot()).toMatchObject({
                complete: false,
                readsUsed: phase === 'index' ? 0 : 1,
            });
            releaseOwner();
            releaseHost();
        }
    );

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
        loader.stop();
        await loader.refresh(source);
        expect(source.read).not.toHaveBeenCalled();
        expect(loader.getSnapshot()).toMatchObject({ complete: false, readsUsed: 1 });
        await loader.refresh(source, true);
        expect(loader.getSnapshot().complete).toBe(true);
        source.list = vi.fn().mockRejectedValue(new Error('offline'));
        await loader.refresh(source, true);
        expect(loader.getSnapshot().complete).toBe(false);
    });

    it.each(['resolved', 'rejected'])(
        'retries a lifecycle-canceled %s read after switching back without resetting the budget',
        async outcome => {
            const { getCredentialFactsLoader } = await import('../credentialFactsLoader');
            const { loadCredentialFacts } = await import('../credentialFactsStore');
            const otherDid = 'did:example:other';
            let activeDid = did;
            let finish: (value: unknown) => void = () => undefined;
            let fail: (error: Error) => void = () => undefined;
            const pendingRead = new Promise<unknown>((resolve, reject) => {
                finish = resolve;
                fail = reject;
            });
            const loader = getCredentialFactsLoader(did);
            const release = loader.acquire();
            const source = sourceFor(1);
            source.isActive = () => activeDid === did;
            source.read = vi.fn().mockReturnValueOnce(pendingRead).mockResolvedValue(vc);
            const originalRefresh = loader.refresh(source);
            await vi.waitFor(() => expect(source.read).toHaveBeenCalledOnce());

            activeDid = otherDid;
            release();
            const other = getCredentialFactsLoader(otherDid);
            const releaseOther = other.acquire();
            await other.refresh(sourceFor(1));
            expect(await loadCredentialFacts(did)).toEqual([]);

            activeDid = did;
            releaseOther();
            const releaseAgain = loader.acquire();
            const resumedRefresh = loader.refresh(source);
            await resumedRefresh;
            expect(source.read).toHaveBeenCalledTimes(2);
            if (outcome === 'resolved') finish(vc);
            else fail(new Error('read canceled during account switch'));
            await originalRefresh;

            expect(source.read).toHaveBeenCalledTimes(2);
            expect(loader.getSnapshot()).toMatchObject({ complete: true, total: 1, readsUsed: 3 });
            expect(await loadCredentialFacts(did)).toEqual([
                expect.objectContaining({ uri: 'lc:0' }),
            ]);
            releaseAgain();
        }
    );

    it('does not let a canceled read clear a newer refresh or its failed-attempt marker', async () => {
        const { createCredentialFactsLoader } = await import('../credentialFactsLoader');
        const loader = createCredentialFactsLoader(did);
        let finishOld: (value: unknown) => void = () => undefined;
        let failNew: (error: Error) => void = () => undefined;
        const oldRead = new Promise<unknown>(resolve => {
            finishOld = resolve;
        });
        const newRead = new Promise<unknown>((_, reject) => {
            failNew = reject;
        });
        const source = sourceFor(1);
        source.read = vi.fn().mockReturnValueOnce(oldRead).mockReturnValueOnce(newRead);
        const oldRefresh = loader.refresh(source);
        await vi.waitFor(() => expect(source.read).toHaveBeenCalledOnce());

        loader.stop();
        const newRefresh = loader.refresh(source);
        await vi.waitFor(() => expect(source.read).toHaveBeenCalledTimes(2));
        finishOld(vc);
        await oldRefresh;
        const sharedRefresh = loader.refresh(source);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(source.list).toHaveBeenCalledTimes(2);

        failNew(new Error('unreadable'));
        await Promise.all([newRefresh, sharedRefresh]);
        loader.stop();
        await loader.refresh(source);
        expect(source.read).toHaveBeenCalledTimes(2);
        expect(loader.getSnapshot()).toMatchObject({ complete: false, readsUsed: 2 });
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
