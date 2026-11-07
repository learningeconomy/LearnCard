import { QueryClient, QueryObserver, dehydrate, hydrate } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryPersister } from './createQueryPersister';

const ownProfileKey = ['getProfile', '', undefined];

const snapshot = (client: QueryClient): PersistedClient => ({
    buster: '',
    timestamp: Date.now(),
    clientState: dehydrate(client),
});

describe('query persistence save barrier', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('refetches a missing own profile after creation and reload before the next cache flush', async () => {
        let stored: string | undefined;
        const storage = {
            getItem: async () => stored,
            setItem: async (_key: string, value: string) => {
                stored = value;
            },
            removeItem: async () => {
                stored = undefined;
            },
        };
        const { persister } = createQueryPersister(storage, vi.fn());
        const beforeReload = new QueryClient();
        beforeReload.setQueryData(ownProfileKey, null);
        persister.persistClient(snapshot(beforeReload));
        await vi.advanceTimersByTimeAsync(1000);

        const profile = { profileId: 'new-user', displayName: 'New User' };
        beforeReload.setQueryData(ownProfileKey, profile);
        persister.persistClient(snapshot(beforeReload));
        // A hard navigation destroys the old document and its pending one-second flush.
        vi.clearAllTimers();
        beforeReload.clear();

        const restored = new QueryClient();
        const nextPage = createQueryPersister(storage, vi.fn());
        const persisted = await nextPage.persister.restoreClient();
        if (persisted) hydrate(restored, persisted.clientState);
        const fetchProfile = vi.fn(async () => profile);
        const observer = new QueryObserver(restored, {
            queryKey: ownProfileKey,
            queryFn: fetchProfile,
            staleTime: 5 * 60 * 1000,
        });
        const unsubscribe = observer.subscribe(() => {});
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(fetchProfile).toHaveBeenCalledOnce();
            expect(observer.getCurrentResult().data).toEqual(profile);
        } finally {
            unsubscribe();
            restored.clear();
        }
    });

    it('discards legacy missing own profiles on restore without dropping positive or public profiles', async () => {
        const client = new QueryClient();
        const organizationKey = ['getProfile', 'did:web:organization', undefined];
        const publicProfileKey = ['getProfile', '', 'missing-public-profile'];
        const knownProfileKey = ['getProfile', '', 'known-public-profile'];
        client.setQueryData(ownProfileKey, null);
        client.setQueryData(organizationKey, null);
        client.setQueryData(publicProfileKey, null);
        client.setQueryData(knownProfileKey, { profileId: 'known-public-profile' });
        client.setQueryData(['credentials'], []);
        // Legacy snapshots bypass the current write policy and serialize undefined keys as null.
        const stored = JSON.stringify(snapshot(client));
        const { persister } = createQueryPersister(
            {
                getItem: async () => stored,
                setItem: async () => undefined,
                removeItem: async () => undefined,
            },
            vi.fn()
        );
        const restored = new QueryClient();
        hydrate(restored, (await persister.restoreClient())!.clientState);
        expect(restored.getQueryState(ownProfileKey)).toBeUndefined();
        expect(restored.getQueryState(organizationKey)).toBeUndefined();
        expect(restored.getQueryData(publicProfileKey)).toBeNull();
        expect(restored.getQueryData(knownProfileKey)).toEqual({
            profileId: 'known-public-profile',
        });
        expect(restored.getQueryData(['credentials'])).toEqual([]);
        client.clear();
        restored.clear();
    });

    it.each(['background', 'explicit'] as const)(
        'does not persist missing own profiles through %s saves',
        async mode => {
            let stored: string | undefined;
            const { persister, persistNow } = createQueryPersister(
                {
                    getItem: async () => stored,
                    setItem: async (_key, value) => {
                        stored = value;
                    },
                    removeItem: async () => undefined,
                },
                vi.fn()
            );
            const client = new QueryClient();
            client.setQueryData(ownProfileKey, null);
            client.setQueryData(['credentials'], []);
            if (mode === 'explicit') await persistNow(client);
            else {
                persister.persistClient(snapshot(client));
                await vi.advanceTimersByTimeAsync(1000);
            }
            const saved = JSON.parse(stored!) as PersistedClient;
            expect(saved.clientState.queries.map(query => query.queryKey)).toEqual([
                ['credentials'],
            ]);
            // Persistence must not change the current page's authoritative absence result.
            expect(client.getQueryData(ownProfileKey)).toBeNull();
            client.clear();
        }
    );

    it('waits for an older write, supersedes queued snapshots and restores the exact saved identity', async () => {
        let stored: string | undefined;
        let releaseOldWrite!: () => void;
        const oldWrite = new Promise<void>(resolve => {
            releaseOldWrite = resolve;
        });
        const storage = {
            getItem: vi.fn(async () => stored),
            setItem: vi.fn(async (_key: string, value: string) => {
                if (storage.setItem.mock.calls.length === 1) await oldWrite;
                stored = value;
            }),
            removeItem: vi.fn(async () => {
                stored = undefined;
            }),
        };
        const onError = vi.fn();
        const { persister, persistNow } = createQueryPersister(storage, onError);
        const client = new QueryClient();
        client.setQueryData(ownProfileKey, { profileId: 'parent', displayName: 'Verify Learner' });
        persister.persistClient(snapshot(client));
        await vi.advanceTimersByTimeAsync(1000);
        expect(storage.setItem).toHaveBeenCalledTimes(1);

        // Queue another pre-save snapshot while the earlier storage operation is in flight.
        persister.persistClient(snapshot(client));
        client.setQueryData(ownProfileKey, {
            profileId: 'parent',
            displayName: 'Exact Saved Name',
        });
        let completed = false;
        const saving = persistNow(client).then(() => {
            completed = true;
        });
        await Promise.resolve();
        expect(completed).toBe(false);
        releaseOldWrite();
        await saving;
        await vi.advanceTimersByTimeAsync(2000);
        expect(storage.setItem).toHaveBeenCalledTimes(2);
        expect(onError).not.toHaveBeenCalled();

        const restored = new QueryClient();
        const persisted = await persister.restoreClient();
        expect(persisted).toBeDefined();
        hydrate(restored, persisted!.clientState);
        expect(restored.getQueryData(ownProfileKey)).toEqual({
            profileId: 'parent',
            displayName: 'Exact Saved Name',
        });
        client.clear();
        restored.clear();
    });

    it('retains batched ordinary writes and rejects a failed explicit durable save', async () => {
        let stored: string | undefined;
        const storage = {
            getItem: vi.fn(async () => stored),
            setItem: vi.fn(async (_key: string, value: string) => {
                stored = value;
            }),
            removeItem: vi.fn(async () => undefined),
        };
        const { persister, persistNow } = createQueryPersister(storage, vi.fn());
        const client = new QueryClient();
        client.setQueryData(ownProfileKey, { displayName: 'Before' });
        persister.persistClient(snapshot(client));
        client.setQueryData(ownProfileKey, { displayName: 'After' });
        persister.persistClient(snapshot(client));
        expect(storage.setItem).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        expect(storage.setItem).toHaveBeenCalledTimes(1);
        storage.setItem.mockRejectedValueOnce(new Error('disk unavailable'));
        await expect(persistNow(client)).rejects.toThrow('disk unavailable');
        client.setQueryData(ownProfileKey, { displayName: 'Recovered' });
        await persistNow(client);
        const restored = new QueryClient();
        hydrate(restored, (await persister.restoreClient())!.clientState);
        expect(restored.getQueryData(ownProfileKey)).toEqual({ displayName: 'Recovered' });
        restored.clear();
        client.clear();
    });

    it('reports background serialization failures and can persist a later valid snapshot', async () => {
        let stored: string | undefined;
        const onError = vi.fn();
        const { persister, persistNow } = createQueryPersister(
            {
                getItem: async () => stored,
                setItem: async (_key, value) => {
                    stored = value;
                },
                removeItem: async () => {
                    stored = undefined;
                },
            },
            onError
        );
        const client = new QueryClient();
        client.setQueryData(ownProfileKey, { unsupported: 1n });
        persister.persistClient(snapshot(client));
        await vi.advanceTimersByTimeAsync(1000);
        expect(onError).toHaveBeenCalledWith(expect.any(TypeError));
        expect(stored).toBeUndefined();

        client.setQueryData(ownProfileKey, { displayName: 'Saved after recovery' });
        await persistNow(client);
        const restored = new QueryClient();
        hydrate(restored, (await persister.restoreClient())!.clientState);
        expect(restored.getQueryData(ownProfileKey)).toEqual({
            displayName: 'Saved after recovery',
        });
        client.clear();
        restored.clear();
    });
    it('stamps explicit saves with the app buster so they survive a same-version restore', async () => {
        let stored: string | undefined;
        const storage = {
            getItem: vi.fn(async () => stored),
            setItem: vi.fn(async (_key: string, value: string) => {
                stored = value;
            }),
            removeItem: vi.fn(async () => undefined),
        };
        const { persister, persistNow } = createQueryPersister(storage, vi.fn(), '1.2.3');
        const client = new QueryClient();
        client.setQueryData(ownProfileKey, { displayName: 'Versioned' });
        await persistNow(client);
        expect((await persister.restoreClient())?.buster).toBe('1.2.3');
        client.clear();
    });

    it('logout removal drops a throttled snapshot so the previous user is not written back', async () => {
        let stored: string | undefined = 'previous-user-cache';
        const storage = {
            getItem: vi.fn(async () => stored),
            setItem: vi.fn(async (_key: string, value: string) => {
                stored = value;
            }),
            removeItem: vi.fn(async () => {
                stored = undefined;
            }),
        };
        const { persister } = createQueryPersister(storage, vi.fn());
        const client = new QueryClient();
        client.setQueryData(ownProfileKey, { displayName: 'Previous User' });
        persister.persistClient(snapshot(client));

        await persister.removeClient();
        await vi.advanceTimersByTimeAsync(2000);

        expect(stored).toBeUndefined();
        expect(storage.setItem).not.toHaveBeenCalled();
        expect(await persister.restoreClient()).toBeUndefined();
        client.clear();
    });
});
