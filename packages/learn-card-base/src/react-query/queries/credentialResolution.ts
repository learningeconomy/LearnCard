import { queryOptions, type QueryClient } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

export const RESOLVED_CREDENTIAL_STALE_TIME = 1000 * 60 * 60 * 24 * 7;

/** Keep the URI second so existing URI/prefix invalidations still match. */
export const resolvedCredentialQueryKey = (uri: string | undefined, accountDid: string) =>
    ['useGetResolvedCredential', uri, accountDid] as const;

/** Raw documents share one account-scoped cache; edited Boost views stay separate. */
export const resolvedCredentialQueryOptions = (
    wallet: BespokeLearnCard | null,
    uri: string | undefined
) =>
    queryOptions({
        queryKey: resolvedCredentialQueryKey(uri, wallet?.id.did() ?? ''),
        queryFn: async (): Promise<VC> => {
            if (!wallet || !uri) throw new Error('Credential reader is not ready');
            const credential = (await wallet.read.get(uri)) as VC | undefined;
            if (!credential) throw new Error('Unable to resolve credential');
            return credential;
        },
        staleTime: RESOLVED_CREDENTIAL_STALE_TIME,
    });

/** Deduplicates concurrent readers and reuses fresh documents, including discovery. */
export const fetchResolvedCredential = (
    queryClient: QueryClient,
    wallet: BespokeLearnCard,
    uri: string
): Promise<VC> => queryClient.fetchQuery(resolvedCredentialQueryOptions(wallet, uri));
