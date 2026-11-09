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
    CREDENTIAL_RESOLVE_BATCH_SIZE,
    CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
    processWithConcurrency,
} from './credentialResolution';

const credential = { type: ['VerifiableCredential'], credentialSubject: { id: 'subject' } } as VC;
const makeWallet = (did: string, read = vi.fn().mockResolvedValue(credential)) => ({
    wallet: { id: { did: () => did }, read: { get: read } } as unknown as BespokeLearnCard,
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

describe('prefetchResolvedCredentials (LC-2382)', () => {
    it('collapses many URIs into chunked learnCloudBatchResolve calls and seeds the shared cache', async () => {
        const client = makeClient();
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const read = vi.fn();
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
        } as unknown as BespokeLearnCard;

        const uris = Array.from({ length: 73 }, (_, i) => `uri-${i}`);
        const results = await prefetchResolvedCredentials(client, wallet, uris);

        expect(batch).toHaveBeenCalledTimes(2); // 64 + 9 with CREDENTIAL_RESOLVE_BATCH_SIZE
        expect(batch.mock.calls[0][0]).toHaveLength(CREDENTIAL_RESOLVE_BATCH_SIZE);
        expect(batch.mock.calls[1][0]).toHaveLength(73 - CREDENTIAL_RESOLVE_BATCH_SIZE);
        expect(read).not.toHaveBeenCalled();
        expect(results).toHaveLength(73);
        expect(results.every(vc => vc === credential)).toBe(true);
        expect(client.getQueryData(resolvedCredentialQueryKey('uri-0', 'account-a'))).toEqual(
            credential
        );
        expect(client.getQueryData(resolvedCredentialQueryKey('uri-72', 'account-a'))).toEqual(
            credential
        );
    });

    it('isolates null slots without rejecting the rest of the batch', async () => {
        const client = makeClient();
        const batch = vi.fn(async () => [credential, null, credential]);
        const read = vi.fn().mockResolvedValue(undefined);
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
        } as unknown as BespokeLearnCard;

        const results = await prefetchResolvedCredentials(client, wallet, ['a', 'b', 'c']);
        expect(results).toEqual([credential, undefined, credential]);
        expect(read).toHaveBeenCalledExactlyOnceWith('b');
        expect(client.getQueryData(resolvedCredentialQueryKey('b', 'account-a'))).toBeUndefined();
    });

    it('recovers null batch slots via wallet.read.get in prefetch (cross-host / other planes)', async () => {
        const client = makeClient();
        const other = { ...credential, credentialSubject: { id: 'other' } } as VC;
        const batch = vi.fn(async () => [credential, null, null]);
        const read = vi.fn(async (uri: string) => (uri === 'cross' ? other : undefined));
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
        } as unknown as BespokeLearnCard;

        const results = await prefetchResolvedCredentials(client, wallet, [
            'same',
            'cross',
            'missing',
        ]);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(read.mock.calls.map(c => c[0]).sort()).toEqual(['cross', 'missing']);
        expect(results).toEqual([credential, other, undefined]);
        expect(client.getQueryData(resolvedCredentialQueryKey('cross', 'account-a'))).toEqual(
            other
        );
    });

    it('recovers null batch slots via wallet.read.get in the coalescer path', async () => {
        const other = { ...credential, credentialSubject: { id: 'recovered' } } as VC;
        const batch = vi.fn(async () => [null, credential]);
        const read = vi.fn(async (uri: string) => (uri === 'cross' ? other : undefined));
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
        } as unknown as BespokeLearnCard;

        const pending = Promise.all([
            enqueueBatchedCredentialResolve(wallet, 'cross'),
            enqueueBatchedCredentialResolve(wallet, 'same'),
        ]);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledTimes(1));
        await expect(pending).resolves.toEqual([other, credential]);
        expect(read).toHaveBeenCalledExactlyOnceWith('cross');
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
        } as unknown as BespokeLearnCard;

        const uris = Array.from({ length: 20 }, (_, i) => `uri-${i}`);
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
        } as unknown as BespokeLearnCard;

        const results = await prefetchResolvedCredentials(client, wallet, ['a', 'b']);
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
        } as unknown as BespokeLearnCard;
        client.setQueryData(resolvedCredentialQueryKey('cached', 'account-a'), credential);

        await prefetchResolvedCredentials(client, wallet, ['cached', 'fresh']);
        expect(batch).toHaveBeenCalledExactlyOnceWith(['fresh']);
    });

    it('measures critical-path collapse vs serial read.get (instrumented)', async () => {
        const client = makeClient();
        const RTT_MS = 25;
        const N = 24;
        const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

        // Before: N serial storage.resolve-equivalent reads (one URI each).
        const serialRead = vi.fn(async () => {
            await delay(RTT_MS);
            return credential;
        });
        const serialWallet = {
            id: { did: () => 'account-a' },
            read: { get: serialRead },
            invoke: {},
        } as unknown as BespokeLearnCard;
        const uris = Array.from({ length: N }, (_, i) => `uri-${i}`);
        const serialStarted = Date.now();
        for (const uri of uris) {
            await serialWallet.read.get(uri);
        }
        const serialMs = Date.now() - serialStarted;

        // After: one batchResolve round-trip for the same URI set.
        const batch = vi.fn(async (batchUris: string[]) => {
            await delay(RTT_MS);
            return batchUris.map(() => credential);
        });
        const batchWallet = {
            id: { did: () => 'account-b' },
            read: { get: vi.fn() },
            invoke: { learnCloudBatchResolve: batch },
        } as unknown as BespokeLearnCard;
        const batchStarted = Date.now();
        await prefetchResolvedCredentials(client, batchWallet, uris);
        const batchMs = Date.now() - batchStarted;

        expect(serialRead).toHaveBeenCalledTimes(N);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(batch.mock.calls[0][0]).toHaveLength(N);
        // Serial wall clock ≈ N RTTs; batched ≈ 1 RTT. Allow generous jitter for CI.
        expect(serialMs).toBeGreaterThanOrEqual(N * RTT_MS - 30);
        expect(batchMs).toBeLessThan(serialMs / 3);
        expect(batchMs).toBeLessThan(N * RTT_MS * 0.5);
    });
});

describe('enqueueBatchedCredentialResolve (LC-2382)', () => {
    it('coalesces concurrent resolves into one learnCloudBatchResolve call', async () => {
        const batch = vi.fn(async (uris: string[]) => uris.map(() => credential));
        const read = vi.fn();
        const wallet = {
            id: { did: () => 'account-a' },
            read: { get: read },
            invoke: { learnCloudBatchResolve: batch },
        } as unknown as BespokeLearnCard;

        const pending = Promise.all([
            enqueueBatchedCredentialResolve(wallet, 'a'),
            enqueueBatchedCredentialResolve(wallet, 'b'),
            enqueueBatchedCredentialResolve(wallet, 'a'),
        ]);
        await vi.waitFor(() => expect(batch).toHaveBeenCalledTimes(1));
        const results = await pending;
        expect(batch.mock.calls[0][0]).toEqual(['a', 'b']);
        expect(results).toEqual([credential, credential, credential]);
        expect(read).not.toHaveBeenCalled();
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
