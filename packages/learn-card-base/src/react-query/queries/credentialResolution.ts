import { queryOptions, type QueryClient, type QueryObserverOptions } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

export const RESOLVED_CREDENTIAL_STALE_TIME = 1000 * 60 * 60 * 24 * 7;

/** Upper bound on URIs sent in one storage.batchResolve round-trip (LC-2382). */
export const CREDENTIAL_RESOLVE_BATCH_SIZE = 64;

/** When batchResolve is unavailable, cap parallel read.get calls (LC-2382). */
export const CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY = 8;

/** Keep the URI second so existing URI/prefix invalidations still match. */
export const resolvedCredentialQueryKey = (uri: string | undefined, accountDid: string) =>
    ['useGetResolvedCredential', uri, accountDid] as const;

export class UnresolvableCredentialError extends Error {
    constructor() {
        super('Unable to resolve credential');
        this.name = 'UnresolvableCredentialError';
    }
}

type BatchResolveFn = (uris: string[]) => Promise<(VC | null | undefined)[]>;

const getBatchResolve = (wallet: BespokeLearnCard): BatchResolveFn | undefined => {
    const invoke = wallet.invoke as { learnCloudBatchResolve?: BatchResolveFn } | undefined;
    const fn = invoke?.learnCloudBatchResolve;
    return typeof fn === 'function' ? fn.bind(invoke) : undefined;
};

type ResolveWaiter = {
    uri: string;
    resolve: (credential: VC) => void;
    reject: (error: unknown) => void;
};

type WalletCoalesceState = {
    waiters: ResolveWaiter[];
    timer: ReturnType<typeof setTimeout> | null;
};

const coalesceStateByWallet = new WeakMap<object, WalletCoalesceState>();

/**
 * Bounded worker pool. Worker errors propagate — callers isolate per-item failures inside the
 * worker (same shape as credentialRefresh.processWithConcurrency).
 */
export const processWithConcurrency = async <T>(
    items: readonly T[],
    concurrency: number,
    worker: (item: T) => Promise<void>
): Promise<void> => {
    const queue = [...items];
    const runners = Array.from(
        { length: Math.max(1, Math.min(concurrency, queue.length || 1)) },
        async () => {
            while (queue.length > 0) {
                const item = queue.shift() as T;
                await worker(item);
            }
        }
    );
    await Promise.all(runners);
};
/**
 * batchResolve only talks to the current LearnCloud host and maps cross-host URIs, other read
 * planes, and stored-credential envelopes to null. Retry those slots via wallet.read.get (which
 * follows other hosts / planes) before treating them as unresolvable.
 */
const resolveNullSlotsViaRead = async (
    wallet: BespokeLearnCard,
    uris: readonly string[]
): Promise<Map<string, VC>> => {
    const recovered = new Map<string, VC>();
    if (uris.length === 0) return recovered;
    await processWithConcurrency(uris, CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY, async uri => {
        try {
            const credential = (await wallet.read.get(uri)) as VC | undefined;
            if (credential) recovered.set(uri, credential);
        } catch {
            // Leave unset; caller marks unresolvable / leaves uncached.
        }
    });
    return recovered;
};

const flushCoalescedResolves = async (
    wallet: BespokeLearnCard,
    waiters: ResolveWaiter[]
): Promise<void> => {
    if (waiters.length === 0) return;

    const byUri = new Map<string, ResolveWaiter[]>();
    for (const waiter of waiters) {
        const group = byUri.get(waiter.uri);
        if (group) group.push(waiter);
        else byUri.set(waiter.uri, [waiter]);
    }
    const uniqueUris = [...byUri.keys()];
    const batchResolve = getBatchResolve(wallet);

    const settleUri = (uri: string, credential: VC | undefined, error?: unknown) => {
        const group = byUri.get(uri) ?? [];
        for (const waiter of group) {
            if (error) waiter.reject(error);
            else if (credential) waiter.resolve(credential);
            else waiter.reject(new UnresolvableCredentialError());
        }
    };

    if (!batchResolve) {
        await processWithConcurrency(
            uniqueUris,
            CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
            async uri => {
                try {
                    const credential = (await wallet.read.get(uri)) as VC | undefined;
                    settleUri(uri, credential);
                } catch (error) {
                    settleUri(uri, undefined, error);
                }
            }
        );
        return;
    }

    for (let offset = 0; offset < uniqueUris.length; offset += CREDENTIAL_RESOLVE_BATCH_SIZE) {
        const chunk = uniqueUris.slice(offset, offset + CREDENTIAL_RESOLVE_BATCH_SIZE);
        let results: (VC | null | undefined)[] | undefined;
        try {
            results = await batchResolve(chunk);
        } catch (error) {
            // Whole-chunk transport failure: fall back per URI so one bad batch does not sink the page.
            await processWithConcurrency(
                chunk,
                CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
                async uri => {
                    try {
                        const credential = (await wallet.read.get(uri)) as VC | undefined;
                        settleUri(uri, credential);
                    } catch (readError) {
                        settleUri(uri, undefined, readError);
                    }
                }
            );
            continue;
        }

        const hits: { uri: string; credential: VC }[] = [];
        const misses: string[] = [];
        chunk.forEach((uri, index) => {
            const credential = results?.[index] as VC | null | undefined;
            if (credential) hits.push({ uri, credential });
            else misses.push(uri);
        });
        for (const { uri, credential } of hits) settleUri(uri, credential);
        // Null batch slots are not final — read.get can still succeed for other hosts/planes.
        const recovered = await resolveNullSlotsViaRead(wallet, misses);
        for (const uri of misses) settleUri(uri, recovered.get(uri));
    }
};

/**
 * Coalesce concurrent credential resolves for one wallet into storage.batchResolve (LC-2382).
 * Only used when learnCloudBatchResolve is present; otherwise callers use read.get directly so
 * existing single-URI tests and offline wallets keep their previous timing.
 */
export const enqueueBatchedCredentialResolve = (
    wallet: BespokeLearnCard,
    uri: string
): Promise<VC> =>
    new Promise<VC>((resolve, reject) => {
        let state = coalesceStateByWallet.get(wallet);
        if (!state) {
            state = { waiters: [], timer: null };
            coalesceStateByWallet.set(wallet, state);
        }
        state.waiters.push({ uri, resolve, reject });
        if (state.timer == null) {
            state.timer = setTimeout(() => {
                const waiters = state!.waiters;
                state!.waiters = [];
                state!.timer = null;
                void flushCoalescedResolves(wallet, waiters);
            }, 0);
        }
    });

/** Raw documents share one account-scoped cache; edited Boost views stay separate. */
export const resolvedCredentialQueryOptions = (
    wallet: BespokeLearnCard | null,
    uri: string | undefined,
    retryPolicy: QueryObserverOptions<VC>['retry'] = 3
) =>
    queryOptions({
        queryKey: resolvedCredentialQueryKey(uri, wallet?.id.did() ?? ''),
        queryFn: async (): Promise<VC> => {
            if (!wallet) throw new Error('Credential reader is not ready');
            if (!uri) throw new Error('Credential URI is missing');

            // Prefer coalesced batchResolve when the LearnCloud method exists (Passport warm path).
            if (getBatchResolve(wallet)) {
                return enqueueBatchedCredentialResolve(wallet, uri);
            }

            const credential = (await wallet.read.get(uri)) as VC | undefined;
            if (!credential) throw new UnresolvableCredentialError();
            return credential;
        },
        staleTime: RESOLVED_CREDENTIAL_STALE_TIME,
        retry: (failureCount, error) => {
            // Missing data won't improve during automatic backoff. Explicit later reads can retry.
            if (error instanceof UnresolvableCredentialError) return false;
            if (typeof retryPolicy === 'function') return retryPolicy(failureCount, error);
            return (
                retryPolicy === true ||
                (typeof retryPolicy === 'number' && failureCount < retryPolicy)
            );
        },
    });

/** Deduplicates concurrent readers and reuses fresh documents, including discovery. */
export const fetchResolvedCredential = (
    queryClient: QueryClient,
    wallet: BespokeLearnCard,
    uri: string
): Promise<VC> =>
    queryClient.fetchQuery(
        resolvedCredentialQueryOptions(
            wallet,
            uri,
            // Imperative fetchQuery defaults to no retries; mounted observers default to three.
            queryClient.getDefaultOptions().queries?.retry ?? false
        )
    );

/** List readers isolate failures per record without caching missing or failed reads as fresh data. */
export const tryFetchResolvedCredential = (
    queryClient: QueryClient,
    wallet: BespokeLearnCard,
    uri: string
): Promise<VC | undefined> =>
    fetchResolvedCredential(queryClient, wallet, uri).catch(() => undefined);

const cacheResolvedCredential = (
    queryClient: QueryClient,
    accountDid: string,
    uri: string,
    credential: VC
) => {
    queryClient.setQueryData(resolvedCredentialQueryKey(uri, accountDid), credential);
};

/**
 * Resolve many credential URIs in as few round-trips as possible (LC-2382).
 *
 * Prefer LearnCloud `storage.batchResolve` via `learnCloudBatchResolve`. Fall back to
 * bounded-concurrency `read.get` when the batch method is missing, and retry individual null
 * batch slots via `read.get` (cross-host URIs / other planes / envelopes). One failed URI never
 * rejects the whole list — unresolved slots stay uncached so a later reader can retry.
 */
export const prefetchResolvedCredentials = async (
    queryClient: QueryClient,
    wallet: BespokeLearnCard,
    uris: readonly string[]
): Promise<(VC | undefined)[]> => {
    const accountDid = wallet.id.did();
    const pending: string[] = [];
    const seen = new Set<string>();

    for (const uri of uris) {
        if (!uri || seen.has(uri)) continue;
        seen.add(uri);
        if (queryClient.getQueryData(resolvedCredentialQueryKey(uri, accountDid))) continue;
        pending.push(uri);
    }

    if (pending.length > 0) {
        const batchResolve = getBatchResolve(wallet);

        if (batchResolve) {
            for (let offset = 0; offset < pending.length; offset += CREDENTIAL_RESOLVE_BATCH_SIZE) {
                const chunk = pending.slice(offset, offset + CREDENTIAL_RESOLVE_BATCH_SIZE);
                let results: (VC | null | undefined)[] | undefined;
                try {
                    results = await batchResolve(chunk);
                } catch {
                    results = undefined;
                }

                if (!results) {
                    // Call read.get directly — tryFetch would re-enter batchResolve via queryFn.
                    await processWithConcurrency(
                        chunk,
                        CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
                        async uri => {
                            try {
                                const credential = (await wallet.read.get(uri)) as VC | undefined;
                                if (credential) {
                                    cacheResolvedCredential(
                                        queryClient,
                                        accountDid,
                                        uri,
                                        credential
                                    );
                                }
                            } catch {
                                // Leave uncached; one failed URI must not sink the list.
                            }
                        }
                    );
                    continue;
                }

                const misses: string[] = [];
                chunk.forEach((uri, index) => {
                    const credential = results?.[index] as VC | null | undefined;
                    if (credential) {
                        cacheResolvedCredential(queryClient, accountDid, uri, credential);
                    } else {
                        misses.push(uri);
                    }
                });
                // Retry null slots via read.get (cross-host / other planes / envelopes).
                const recovered = await resolveNullSlotsViaRead(wallet, misses);
                for (const uri of misses) {
                    const credential = recovered.get(uri);
                    if (credential) {
                        cacheResolvedCredential(queryClient, accountDid, uri, credential);
                    }
                    // Still-null: leave uncached so remounts with staleTime 0 can retry.
                }
            }
        } else {
            await processWithConcurrency(
                pending,
                CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
                async uri => {
                    await tryFetchResolvedCredential(queryClient, wallet, uri);
                }
            );
        }
    }

    return uris.map(uri =>
        uri
            ? (queryClient.getQueryData(resolvedCredentialQueryKey(uri, accountDid)) as
                  VC | undefined)
            : undefined
    );
};
