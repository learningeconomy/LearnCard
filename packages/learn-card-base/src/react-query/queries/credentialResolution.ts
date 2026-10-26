import { queryOptions, type QueryClient, type QueryObserverOptions } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

export const RESOLVED_CREDENTIAL_STALE_TIME = 1000 * 60 * 60 * 24 * 7;

/** Keep the URI second so existing URI/prefix invalidations still match. */
export const resolvedCredentialQueryKey = (uri: string | undefined, accountDid: string) =>
    ['useGetResolvedCredential', uri, accountDid] as const;

export class UnresolvableCredentialError extends Error {
    constructor() {
        super('Unable to resolve credential');
        this.name = 'UnresolvableCredentialError';
    }
}

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
