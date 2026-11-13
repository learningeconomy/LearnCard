import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver, QueriesObserver } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';
import {
    fetchResolvedCredential,
    resolvedCredentialQueryKey,
    resolvedCredentialQueryOptions,
    prefetchResolvedCredentials,
    enqueueBatchedCredentialResolve,
    hasFreshResolvedCredential,
    isCurrentHostCloudUri,
    walletHasVcCachePlugin,
    CREDENTIAL_RESOLVE_BATCH_SIZE,
    CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
    processWithConcurrency,
    RESOLVED_CREDENTIAL_STALE_TIME,
} from './credentialResolution';

const credential = { type: ['VerifiableCredential'], credentialSubject: { id: 'subject' } } as VC;

/** Current-host lc:cloud URI matching default LEARNCLOUD_URL. */
const cloudUri = (id: string) => `lc:cloud:cloud.learncard.com/trpc:credential:${id}`;

const makeWallet = (did: string, read = vi.fn().mockResolvedValue(credential)) => ({
    wallet: {
        id: { did: () => did },
        read: { get: read },
        plugins: [],
    } as unknown as BespokeLearnCard,
    read,
});
const clients: QueryClient[] = [];
const makeClient = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    clients.push(client);
    return client;
};
afterEach(() => clients.splice(0).forEach(client => client.clear()));

describe('shared credential resolution', () => {
    it('shares a pending document between single, multi and imperative consumers', async () => {
        const client = makeClient();
        let resolve!: (vc: VC) => void;
        const { wallet, read } = makeWallet(
            'account-a',
            vi.fn(
                () =>
                    new Promise<VC>(r => {
                        resolve = r;
                    })
            )
        );
        const options = resolvedCredentialQueryOptions(wallet, 'credential-uri');
        const single = new QueryObserver(client, options);
        const many = new QueriesObserver(client, [options, options]);
        const stopSingle = single.subscribe(() => {});
        const stopMany = many.subscribe(() => {});
        const pending = fetchResolvedCredential(client, wallet, 'credential-uri');
        expect(read).toHaveBeenCalledTimes(1);
        resolve(credential);
        await expect(pending).resolves.toEqual(credential);
        expect(single.getCurrentResult().data).toEqual(credential);
        expect(many.getCurrentResult().map(result => result.data)).toEqual([
            credential,
            credential,
        ]);
        await fetchResolvedCredential(client, wallet, 'credential-uri');
        expect(read).toHaveBeenCalledTimes(1);
        stopSingle();
        stopMany();
    });

    it('isolates the same URI by account', async () => {
        const client = makeClient();
        const a = makeWallet('account-a');
        const other = { ...credential, credentialSubject: { id: 'other-subject' } } as VC;
        const b = makeWallet('account-b', vi.fn().mockResolvedValue(other));
        expect(await fetchResolvedCredential(client, a.wallet, 'same-uri')).toEqual(credential);
        expect(await fetchResolvedCredential(client, b.wallet, 'same-uri')).toEqual(other);
        expect(a.read).toHaveBeenCalledTimes(1);
        expect(b.read).toHaveBeenCalledTimes(1);
    });

    it('honors URI-prefix invalidation and explicit observer refetches', async () => {
        const client = makeClient();
        const { wallet, read } = makeWallet('account-a');
        await fetchResolvedCredential(client, wallet, 'uri');
        read.mockResolvedValue({ ...credential, name: 'Updated' });
        await client.invalidateQueries({ queryKey: ['useGetResolvedCredential', 'uri'] });
        expect(await fetchResolvedCredential(client, wallet, 'uri')).toMatchObject({
            name: 'Updated',
        });
        const observer = new QueryObserver(client, resolvedCredentialQueryOptions(wallet, 'uri'));
        await observer.refetch();
        expect(read).toHaveBeenCalledTimes(3);
        expect(client.getQueryData(resolvedCredentialQueryKey('uri', 'account-a'))).toMatchObject({
            name: 'Updated',
        });
    });

    it('does not retain failed or missing reads as fresh data', async () => {
        const client = makeClient();
        const { wallet, read } = makeWallet(
            'account-a',
            vi
                .fn()
                .mockRejectedValueOnce(new Error('offline'))
                .mockResolvedValueOnce(undefined)
                .mockResolvedValue(credential)
        );
        await expect(fetchResolvedCredential(client, wallet, 'uri')).rejects.toThrow('offline');
        await expect(fetchResolvedCredential(client, wallet, 'uri')).rejects.toThrow(
            'Unable to resolve'
        );
        await expect(fetchResolvedCredential(client, wallet, 'uri')).resolves.toEqual(credential);
        expect(read).toHaveBeenCalledTimes(3);
    });
});

it('does not automatically retry missing data and allows an explicit later recovery', async () => {
    const client = makeClient();
    client.setDefaultOptions({ queries: { retry: 3, retryDelay: 0 } });
    const { wallet, read } = makeWallet('account-a', vi.fn().mockResolvedValue(undefined));
    const observer = new QueryObserver(client, resolvedCredentialQueryOptions(wallet, 'missing'));
    const missing = await observer.refetch();
    expect(missing.isError).toBe(true);
    expect(read).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(resolvedCredentialQueryKey('missing', 'account-a'))).toBeUndefined();
    read.mockResolvedValue(credential);
    expect((await observer.refetch()).data).toEqual(credential);
    expect(read).toHaveBeenCalledTimes(2);
});

it.each([false, 1, (failureCount: number) => failureCount < 1])(
    'honors the configured transport retry policy (%s)',
    async retry => {
        const client = makeClient();
        client.setDefaultOptions({ queries: { retry, retryDelay: 0 } });
        const { wallet, read } = makeWallet(
            'account-a',
            vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(credential)
        );
        if (retry === false) {
            await expect(fetchResolvedCredential(client, wallet, 'uri')).rejects.toThrow('offline');
            expect(read).toHaveBeenCalledTimes(1);
        } else {
            await expect(fetchResolvedCredential(client, wallet, 'uri')).resolves.toEqual(
                credential
            );
            expect(read).toHaveBeenCalledTimes(2);
        }
    }
);

it('matches fetchQuery’s no-retry default when the client has no retry setting', async () => {
    const client = new QueryClient();
    clients.push(client);
    const rawRead = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(client.fetchQuery({ queryKey: ['baseline'], queryFn: rawRead })).rejects.toThrow(
        'offline'
    );
    const { wallet, read } = makeWallet(
        'account-a',
        vi.fn().mockRejectedValue(new Error('offline'))
    );
    await expect(fetchResolvedCredential(client, wallet, 'uri')).rejects.toThrow('offline');
    expect(rawRead).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
});

describe('isCurrentHostCloudUri / walletHasVcCachePlugin', () => {
    it('accepts current-host lc:cloud URIs and rejects foreign or non-cloud URIs', () => {
        expect(isCurrentHostCloudUri(cloudUri('abc'))).toBe(true);
        expect(isCurrentHostCloudUri('lc:cloud:evil.example/trpc:credential:abc')).toBe(false);
        expect(isCurrentHostCloudUri('https://example.com/cred')).toBe(false);
        expect(isCurrentHostCloudUri('uri-0')).toBe(false);
    });

    it('detects a native VC cache plugin via plugins[].cache.getVc', () => {
        const without = { plugins: [] } as unknown as BespokeLearnCard;
        const withCache = {
            plugins: [{ cache: { getVc: vi.fn(), setVc: vi.fn() } }],
        } as unknown as BespokeLearnCard;
        expect(walletHasVcCachePlugin(without)).toBe(false);
        expect(walletHasVcCachePlugin(withCache)).toBe(true);
    });
});

describe('prefetchResolvedCredentials (LC-2382)', () => {
    it('collapses many current-host URIs into chunked learnCloudBatchResolve calls', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const read = vi.fn();
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const uris = Array.from({ length: 73 }, (_, i) => cloudUri(`id-${i}`));
        const results = await prefetchResolvedCredentials(client, wallet, uris);

        expect(batch).toHaveBeenCalledTimes(2);
        expect(batch.mock.calls[0][0]).toHaveLength(CREDENTIAL_RESOLVE_BATCH_SIZE);
        expect(batch.mock.calls[1][0]).toHaveLength(73 - CREDENTIAL_RESOLVE_BATCH_SIZE);
        expect(read).not.toHaveBeenCalled();
        expect(results).toHaveLength(73);
        expect(results.every(vc => vc === credential)).toBe(true);
    });

    it('routes foreign-host URIs through read.get instead of batchResolve', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const foreign = {
            ...credential,
            credentialSubject: { id: 'foreign' },
        } as VC;
        const read = vi.fn(async (uri: string) =>
            uri.includes('evil.example') ? foreign : undefined
        );
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const local = cloudUri('local');
        const remote = 'lc:cloud:evil.example/trpc:credential:remote';
        const results = await prefetchResolvedCredentials(client, wallet, [local, remote]);

        expect(batch).toHaveBeenCalledExactlyOnceWith([local]);
        expect(read).toHaveBeenCalledExactlyOnceWith(remote);
        expect(results).toEqual([credential, foreign]);
    });

    it('uses read.get (not batch) when a native VC cache plugin is present', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const getVc = vi.fn().mockResolvedValue(undefined);
        const setVc = vi.fn();
        const read = vi.fn(async () => credential);
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [{ cache: { getVc, setVc } }],
            cache: { getVc, setVc },
        } as unknown as BespokeLearnCard;

        const uris = [cloudUri('a'), cloudUri('b')];
        const results = await prefetchResolvedCredentials(client, wallet, uris);

        expect(batch).not.toHaveBeenCalled();
        expect(read).toHaveBeenCalledTimes(2);
        expect(results).toEqual([credential, credential]);
    });

    it('does not reuse invalidated or stale query data', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) =>
            uris.map(() => ({ ...credential, name: 'fresh' }) as VC)
        );
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: vi.fn() },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        const uri = cloudUri('cached');
        client.setQueryData(resolvedCredentialQueryKey(uri, 'account-a'), {
            ...credential,
            name: 'stale',
        });
        await client.invalidateQueries({ queryKey: resolvedCredentialQueryKey(uri, 'account-a') });

        expect(hasFreshResolvedCredential(client, 'account-a', uri)).toBe(false);

        const results = await prefetchResolvedCredentials(client, wallet, [uri]);
        expect(batch).toHaveBeenCalledExactlyOnceWith([uri]);
        expect(results[0]).toMatchObject({ name: 'fresh' });
    });

    it('joins in-flight fetches instead of starting a duplicate network read', async () => {
        const client = makeClient();
        let resolveRead!: (vc: VC) => void;
        const read = vi.fn(
            () =>
                new Promise<VC>(r => {
                    resolveRead = r;
                })
        );
        // No batch method — both paths use read.get / fetchQuery so we can observe joining.
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: {},
            plugins: [],
        } as unknown as BespokeLearnCard;
        const uri = cloudUri('inflight');

        const inflight = fetchResolvedCredential(client, wallet, uri);
        expect(read).toHaveBeenCalledTimes(1);

        const prefetchPromise = prefetchResolvedCredentials(client, wallet, [uri]);
        resolveRead(credential);
        await expect(inflight).resolves.toEqual(credential);
        await expect(prefetchPromise).resolves.toEqual([credential]);
        expect(read).toHaveBeenCalledTimes(1);
    });

    it('isolates null slots without rejecting the rest of the batch', async () => {
        const client = makeClient();
        const batch = vi.fn(async () => [credential, null, credential]);
        const read = vi.fn().mockResolvedValue(undefined);
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const results = await prefetchResolvedCredentials(client, wallet, [
            cloudUri('a'),
            cloudUri('b'),
            cloudUri('c'),
        ]);
        expect(results).toEqual([credential, undefined, credential]);
        expect(read).toHaveBeenCalledExactlyOnceWith(cloudUri('b'));
    });

    it('recovers null batch slots via wallet.read.get', async () => {
        const client = makeClient();
        const other = { ...credential, credentialSubject: { id: 'other' } } as VC;
        const batch = vi.fn(async () => [credential, null, null]);
        const read = vi.fn(async (uri: string) => (uri === cloudUri('cross') ? other : undefined));
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const results = await prefetchResolvedCredentials(client, wallet, [
            cloudUri('same'),
            cloudUri('cross'),
            cloudUri('missing'),
        ]);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(results).toEqual([credential, other, undefined]);
    });

    it('falls back to bounded-concurrency read.get when batchResolve is missing', async () => {
        const client = makeClient();
        let inFlight = 0;
        let maxInFlight = 0;
        const read = vi.fn(async () => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await Promise.resolve();
            inFlight -= 1;
            return credential;
        });
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: {},
            plugins: [],
        } as unknown as BespokeLearnCard;

        const uris = Array.from({ length: 20 }, (_, i) => cloudUri(`id-${i}`));
        await prefetchResolvedCredentials(client, wallet, uris);
        expect(read).toHaveBeenCalledTimes(20);
        expect(maxInFlight).toBeLessThanOrEqual(CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY);
        expect(maxInFlight).toBeGreaterThan(1);
    });

    it('falls back per chunk when learnCloudBatchResolve throws', async () => {
        const client = makeClient();
        const batch = vi.fn(async () => {
            throw new Error('batch unavailable');
        });
        const read = vi.fn(async () => credential);
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const results = await prefetchResolvedCredentials(client, wallet, [
            cloudUri('a'),
            cloudUri('b'),
        ]);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(read).toHaveBeenCalledTimes(2);
        expect(results).toEqual([credential, credential]);
    });

    it('skips URIs already fresh in the shared cache', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: vi.fn() },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        client.setQueryData(
            resolvedCredentialQueryKey(cloudUri('cached'), 'account-a'),
            credential
        );

        await prefetchResolvedCredentials(client, wallet, [cloudUri('cached'), cloudUri('fresh')]);
        expect(batch).toHaveBeenCalledExactlyOnceWith([cloudUri('fresh')]);
    });

    it('measures critical-path collapse vs serial read.get (instrumented)', async () => {
        const client = makeClient();
        const RTT_MS = 25;
        const N = 24;
        const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

        const serialRead = vi.fn(async () => {
            await delay(RTT_MS);
            return credential;
        });
        const serialWallet = {
            id: { did: () => 'account-a' },
            read: { get: serialRead },
            invoke: {},
            plugins: [],
        } as unknown as BespokeLearnCard;
        const uris = Array.from({ length: N }, (_, i) => cloudUri(`id-${i}`));
        const serialStarted = Date.now();
        for (const uri of uris) {
            await serialWallet.read.get(uri);
        }
        const serialMs = Date.now() - serialStarted;

        const batch = vi.fn(async (batchUris: string[]) => {
            await delay(RTT_MS);
            return batchUris.map(() => credential);
        });
        const batchWallet = {
            id: { did: () => 'account-b' },
            read: { get: vi.fn() },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        const batchStarted = Date.now();
        await prefetchResolvedCredentials(client, batchWallet, uris);
        const batchMs = Date.now() - batchStarted;

        expect(serialRead).toHaveBeenCalledTimes(N);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(batch.mock.calls[0][0]).toHaveLength(N);
        expect(serialMs).toBeGreaterThanOrEqual(N * RTT_MS - 30);
        expect(batchMs).toBeLessThan(serialMs / 3);
        expect(batchMs).toBeLessThan(N * RTT_MS * 0.5);
    });

    it('returns an unresolved slot when an invalidated refresh fails (goblincore r4520242042)', async () => {
        const client = makeClient();
        const batch = vi.fn(async () => [null]);
        const read = vi.fn().mockResolvedValue(undefined);
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        const uri = cloudUri('stale-after-fail');
        const stale = { ...credential, name: 'stale' } as VC;
        client.setQueryData(resolvedCredentialQueryKey(uri, 'account-a'), stale);
        await client.invalidateQueries({ queryKey: resolvedCredentialQueryKey(uri, 'account-a') });

        const results = await prefetchResolvedCredentials(client, wallet, [uri]);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(read).toHaveBeenCalledWith(uri);
        expect(results).toEqual([undefined]);
        expect(hasFreshResolvedCredential(client, 'account-a', uri)).toBe(false);
        expect(client.getQueryData(resolvedCredentialQueryKey(uri, 'account-a'))).toEqual(stale);
    });

    it('shares in-flight batch work from prefetch to a later reader (goblincore r4520242045)', async () => {
        const client = makeClient();
        let release!: (vcs: VC[]) => void;
        const batch = vi.fn(
            () =>
                new Promise<VC[]>(resolve => {
                    release = resolve;
                })
        );
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: vi.fn() },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        const uri = cloudUri('shared-prefetch');

        const prefetchPromise = prefetchResolvedCredentials(client, wallet, [uri]);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledTimes(1));

        const reader = fetchResolvedCredential(client, wallet, uri);
        await Promise.resolve();
        expect(batch).toHaveBeenCalledTimes(1);

        release([credential]);
        await expect(prefetchPromise).resolves.toEqual([credential]);
        await expect(reader).resolves.toEqual(credential);
    });

    it('shares in-flight batch work from a reader to a later prefetch (goblincore r4520242045)', async () => {
        const client = makeClient();
        let release!: (vcs: VC[]) => void;
        const batch = vi.fn(
            () =>
                new Promise<VC[]>(resolve => {
                    release = resolve;
                })
        );
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: vi.fn() },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        const uri = cloudUri('shared-reader');

        const reader = fetchResolvedCredential(client, wallet, uri);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledTimes(1));

        const prefetchPromise = prefetchResolvedCredentials(client, wallet, [uri]);
        await Promise.resolve();
        expect(batch).toHaveBeenCalledTimes(1);

        release([credential]);
        await expect(reader).resolves.toEqual(credential);
        await expect(prefetchPromise).resolves.toEqual([credential]);
    });

    it('starts the same-host batch without waiting for a stuck foreign read (goblincore r4520242049)', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const read = vi.fn((uri: string) =>
            uri.includes('evil.example')
                ? new Promise<VC>(() => {
                      /* never settles */
                  })
                : Promise.resolve(credential)
        );
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;
        const local = cloudUri('local-unblocked');
        const remote = 'lc:cloud:evil.example/trpc:credential:stuck';

        const prefetchPromise = prefetchResolvedCredentials(client, wallet, [local, remote]);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledExactlyOnceWith([local]));
        await vi.waitFor(() =>
            expect(client.getQueryData(resolvedCredentialQueryKey(local, 'account-a'))).toEqual(
                credential
            )
        );
        expect(read).toHaveBeenCalledWith(remote);
        void prefetchPromise;
    });
});

describe('enqueueBatchedCredentialResolve (LC-2382)', () => {
    it('coalesces concurrent current-host resolves into one learnCloudBatchResolve call', async () => {
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const read = vi.fn();
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const pending = Promise.all([
            enqueueBatchedCredentialResolve(wallet, cloudUri('a')),
            enqueueBatchedCredentialResolve(wallet, cloudUri('b')),
            enqueueBatchedCredentialResolve(wallet, cloudUri('a')),
        ]);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledTimes(1));
        const results = await pending;
        expect(batch.mock.calls[0][0]).toEqual([cloudUri('a'), cloudUri('b')]);
        expect(results).toEqual([credential, credential, credential]);
        expect(read).not.toHaveBeenCalled();
    });

    it('recovers null batch slots via wallet.read.get in the coalescer path', async () => {
        const other = { ...credential, credentialSubject: { id: 'recovered' } } as VC;
        const batch = vi.fn(async () => [null, credential]);
        const read = vi.fn(async (uri: string) => (uri === cloudUri('cross') ? other : undefined));
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const pending = Promise.all([
            enqueueBatchedCredentialResolve(wallet, cloudUri('cross')),
            enqueueBatchedCredentialResolve(wallet, cloudUri('same')),
        ]);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledTimes(1));
        await expect(pending).resolves.toEqual([other, credential]);
        expect(read).toHaveBeenCalledExactlyOnceWith(cloudUri('cross'));
    });

    it('falls back to read.get for the whole set when a native VC cache plugin is present', async () => {
        const batch = vi.fn();
        const read = vi.fn(async () => credential);
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [{ cache: { getVc: vi.fn(), setVc: vi.fn() } }],
        } as unknown as BespokeLearnCard;

        const pending = Promise.all([
            enqueueBatchedCredentialResolve(wallet, cloudUri('a')),
            enqueueBatchedCredentialResolve(wallet, cloudUri('b')),
        ]);
        await expect(pending).resolves.toEqual([credential, credential]);
        expect(batch).not.toHaveBeenCalled();
        expect(read).toHaveBeenCalledTimes(2);
    });

    it('starts the same-host batch without waiting for a stuck foreign read (goblincore r4520242049)', async () => {
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const read = vi.fn((uri: string) =>
            uri.includes('evil.example')
                ? new Promise<VC>(() => {
                      /* never settles */
                  })
                : Promise.resolve(credential)
        );
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
            plugins: [],
        } as unknown as BespokeLearnCard;

        const local = enqueueBatchedCredentialResolve(wallet, cloudUri('local-flush'));
        const remote = enqueueBatchedCredentialResolve(
            wallet,
            'lc:cloud:evil.example/trpc:credential:stuck-flush'
        );
        await vi.waitFor(() =>
            expect(batch).toHaveBeenCalledExactlyOnceWith([cloudUri('local-flush')])
        );
        await expect(local).resolves.toEqual(credential);
        expect(read).toHaveBeenCalledWith('lc:cloud:evil.example/trpc:credential:stuck-flush');
        void remote;
    });
});

describe('processWithConcurrency', () => {
    it('preserves completion of all items under the concurrency cap', async () => {
        const seen: number[] = [];
        await processWithConcurrency([1, 2, 3, 4, 5], 2, async item => {
            seen.push(item);
        });
        expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
    });
});

describe('hasFreshResolvedCredential', () => {
    it('is false for invalidated entries even when data is present', async () => {
        const client = makeClient();
        const uri = cloudUri('x');
        client.setQueryData(resolvedCredentialQueryKey(uri, 'account-a'), credential);
        expect(hasFreshResolvedCredential(client, 'account-a', uri)).toBe(true);
        await client.invalidateQueries({ queryKey: resolvedCredentialQueryKey(uri, 'account-a') });
        expect(hasFreshResolvedCredential(client, 'account-a', uri)).toBe(false);
    });

    it('is false when dataUpdatedAt is older than the staleTime window', () => {
        const client = makeClient();
        const uri = cloudUri('old');
        client.setQueryData(resolvedCredentialQueryKey(uri, 'account-a'), credential);
        const state = client.getQueryState(resolvedCredentialQueryKey(uri, 'account-a'))!;
        // Force an ancient dataUpdatedAt
        (state as { dataUpdatedAt: number }).dataUpdatedAt =
            Date.now() - RESOLVED_CREDENTIAL_STALE_TIME - 1;
        expect(hasFreshResolvedCredential(client, 'account-a', uri)).toBe(false);
    });
});
