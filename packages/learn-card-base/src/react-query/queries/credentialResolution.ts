import { queryOptions, type QueryClient, type QueryObserverOptions } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';
import { networkStore } from '../../stores/NetworkStore';

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

/**
 * True when a plugin implements the VC cache plane (native SQLite). Empty cache plane stubs on
 * web do not count — goblincore: batch must not bypass native getVc/setVc.
 */
export const walletHasVcCachePlugin = (wallet: BespokeLearnCard): boolean =>
    Boolean(
        (wallet.plugins as { cache?: { getVc?: unknown } }[] | undefined)?.some(
            plugin => typeof plugin?.cache?.getVc === 'function'
        )
    );

/** Encode colons in the domain segment so lc:cloud URIs split cleanly into 5 parts. */
const escapeColonsInDomain = (uri: string): string => {
    const trpcIdx = uri.indexOf('/trpc:');
    if (trpcIdx === -1) return uri;
    const secondColon = uri.indexOf(':', uri.indexOf(':') + 1);
    if (secondColon === -1) return uri;
    const header = uri.substring(0, secondColon + 1);
    const domain = uri.substring(secondColon + 1, trpcIdx);
    const suffix = uri.substring(trpcIdx);
    return header + domain.replace(/:/g, '%3A') + suffix;
};

/**
 * Only current-host lc:cloud URIs are safe to batchResolve: the server looks up by ID and (after
 * the companion server fix) rejects foreign hosts. Non-matching URIs go through read.get.
 */
export const isCurrentHostCloudUri = (
    uri: string,
    cloudUrl: string = networkStore.get.cloudUrl()
): boolean => {
    try {
        const parts = escapeColonsInDomain(uri).split(':');
        if (parts.length !== 5) return false;
        const [lc, method, uriHost] = parts as [string, string, string, string, string];
        if (lc !== 'lc' || method !== 'cloud') return false;
        const normalizedHost = uriHost.replace(/https?:\/\//g, '').replace(/\/$/, '');
        const normalizedCloud = cloudUrl
            .replace(/https?:\/\//g, '')
            .replace(/:/g, '%3A')
            .replace(/\/$/, '');
        return (
            normalizedHost === normalizedCloud ||
            normalizedHost === `${normalizedCloud}` ||
            normalizedHost.replace(/%3A/g, ':') ===
                cloudUrl.replace(/https?:\/\//g, '').replace(/\/$/, '')
        );
    } catch {
        return false;
    }
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

const resolveViaReadGet = async (
    wallet: BespokeLearnCard,
    uri: string
): Promise<VC | undefined> => {
    try {
        return (await wallet.read.get(uri)) as VC | undefined;
    } catch {
        return undefined;
    }
};

/**
 * batchResolve only talks to the current LearnCloud host and maps some envelopes to null. Retry
 * those slots via wallet.read.get before treating them as unresolvable.
 */
const resolveNullSlotsViaRead = async (
    wallet: BespokeLearnCard,
    uris: readonly string[]
): Promise<Map<string, VC>> => {
    const recovered = new Map<string, VC>();
    if (uris.length === 0) return recovered;
    await processWithConcurrency(uris, CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY, async uri => {
        const credential = await resolveViaReadGet(wallet, uri);
        if (credential) recovered.set(uri, credential);
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

    // Native SQLite cache plane: use read.get so cache-first / setVc semantics stay intact.
    if (!batchResolve || walletHasVcCachePlugin(wallet)) {
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

    const batchable = uniqueUris.filter(uri => isCurrentHostCloudUri(uri));
    const nonBatchable = uniqueUris.filter(uri => !isCurrentHostCloudUri(uri));

    await processWithConcurrency(
        nonBatchable,
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

    for (let offset = 0; offset < batchable.length; offset += CREDENTIAL_RESOLVE_BATCH_SIZE) {
        const chunk = batchable.slice(offset, offset + CREDENTIAL_RESOLVE_BATCH_SIZE);
        let results: (VC | null | undefined)[] | undefined;
        try {
            results = await batchResolve(chunk);
        } catch {
            results = undefined;
        }

        if (!results || results.length < chunk.length) {
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
        const recovered = await resolveNullSlotsViaRead(wallet, misses);
        for (const uri of misses) settleUri(uri, recovered.get(uri));
    }
};

/**
 * Coalesce concurrent credential resolves for one wallet into storage.batchResolve (LC-2382).
 * Only used when learnCloudBatchResolve is present and no native VC cache plugin is installed.
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
                flushCoalescedResolves(wallet, waiters).catch(err => {
                    for (const waiter of waiters) {
                        try {
                            waiter.reject(err);
                        } catch {
                            /* already settled */
                        }
                    }
                });
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

            // Batch only when LearnCloud batch exists and native VC cache is absent.
            if (getBatchResolve(wallet) && !walletHasVcCachePlugin(wallet)) {
                return enqueueBatchedCredentialResolve(wallet, uri);
            }

            const credential = (await wallet.read.get(uri)) as VC | undefined;
            if (!credential) throw new UnresolvableCredentialError();
            return credential;
        },
        staleTime: RESOLVED_CREDENTIAL_STALE_TIME,
        retry: (failureCount, error) => {
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

/** True when RQ still has a usable fresh success for this URI (not invalidated / not stale). */
export const hasFreshResolvedCredential = (
    queryClient: QueryClient,
    accountDid: string,
    uri: string,
    now: number = Date.now()
): boolean => {
    const state = queryClient.getQueryState(resolvedCredentialQueryKey(uri, accountDid));
    if (!state || state.status !== 'success' || state.data == null) return false;
    if (state.isInvalidated) return false;
    if (now - state.dataUpdatedAt >= RESOLVED_CREDENTIAL_STALE_TIME) return false;
    return true;
};

/**
 * Resolve many credential URIs in as few round-trips as possible (LC-2382).
 *
 * Prefer LearnCloud `storage.batchResolve` for current-host lc:cloud URIs when no native VC
 * cache plugin is present. Otherwise (and for foreign/non-cloud URIs) use bounded-concurrency
 * `read.get`. Null batch slots retry via `read.get`. Respects RQ invalidation / staleness and
 * joins in-flight fetches.
 */
export const prefetchResolvedCredentials = async (
    queryClient: QueryClient,
    wallet: BespokeLearnCard,
    uris: readonly string[]
): Promise<(VC | undefined)[]> => {
    const accountDid = wallet.id.did();
    const pending: string[] = [];
    const seen = new Set<string>();
    const retryPolicy = queryClient.getDefaultOptions().queries?.retry ?? false;

    for (const uri of uris) {
        if (!uri || seen.has(uri)) continue;
        seen.add(uri);
        const key = resolvedCredentialQueryKey(uri, accountDid);
        const state = queryClient.getQueryState(key);

        if (hasFreshResolvedCredential(queryClient, accountDid, uri)) continue;

        if (state?.fetchStatus === 'fetching') {
            await queryClient
                .fetchQuery(resolvedCredentialQueryOptions(wallet, uri, retryPolicy))
                .catch(() => undefined);
            continue;
        }

        pending.push(uri);
    }

    if (pending.length > 0) {
        const batchResolve = getBatchResolve(wallet);
        const useBatch = Boolean(batchResolve) && !walletHasVcCachePlugin(wallet);

        if (useBatch && batchResolve) {
            const batchable = pending.filter(uri => isCurrentHostCloudUri(uri));
            const nonBatchable = pending.filter(uri => !isCurrentHostCloudUri(uri));

            await processWithConcurrency(
                nonBatchable,
                CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
                async uri => {
                    try {
                        const credential = (await wallet.read.get(uri)) as VC | undefined;
                        if (credential) {
                            cacheResolvedCredential(queryClient, accountDid, uri, credential);
                        }
                    } catch {
                        /* leave uncached */
                    }
                }
            );

            for (
                let offset = 0;
                offset < batchable.length;
                offset += CREDENTIAL_RESOLVE_BATCH_SIZE
            ) {
                const chunk = batchable.slice(offset, offset + CREDENTIAL_RESOLVE_BATCH_SIZE);
                let results: (VC | null | undefined)[] | undefined;
                try {
                    results = await batchResolve(chunk);
                } catch {
                    results = undefined;
                }

                if (!results || results.length < chunk.length) {
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
                                /* leave uncached */
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
                const recovered = await resolveNullSlotsViaRead(wallet, misses);
                for (const uri of misses) {
                    const credential = recovered.get(uri);
                    if (credential) {
                        cacheResolvedCredential(queryClient, accountDid, uri, credential);
                    }
                }
            }
        } else {
            await processWithConcurrency(
                pending,
                CREDENTIAL_RESOLVE_FALLBACK_CONCURRENCY,
                async uri => {
                    // Direct read.get preserves native cache plane; avoid queryFn→batch re-entry.
                    try {
                        const credential = (await wallet.read.get(uri)) as VC | undefined;
                        if (credential) {
                            cacheResolvedCredential(queryClient, accountDid, uri, credential);
                        }
                    } catch {
                        /* leave uncached */
                    }
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
