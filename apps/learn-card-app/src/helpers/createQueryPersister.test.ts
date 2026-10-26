import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
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
});
