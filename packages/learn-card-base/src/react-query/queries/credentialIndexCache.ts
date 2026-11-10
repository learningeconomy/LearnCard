import type { QueryClient } from '@tanstack/react-query';

/** How long credential-index React Query results stay fresh across route mounts (LC-2383).
 * Index walks are expensive; writers must invalidate so add/delete/revoke do not stay stale.
 */
export const CREDENTIAL_INDEX_STALE_TIME = 5 * 60 * 1000;

type InvalidateCredentialIndexOptions = {
    /** Default true. Add/claim already refetches the exact reader-scoped count keys. */
    includeCount?: boolean;
};

/** Invalidate every index-backed credential query this staleTime covers.
 * `useGetCredentials` uses a bare prefix so primary-profile keys (historically
 * `undefined` vs `''`) and every category match. Paginated reads use their own root
 * so a truncated first page cannot overwrite the full list.
 */
export const invalidateCredentialIndexQueries = (
    queryClient: QueryClient,
    didWeb?: string,
    options?: InvalidateCredentialIndexOptions
) => {
    const profileDid = didWeb ?? '';
    const jobs = [
        queryClient.invalidateQueries({ queryKey: ['useGetSkills', profileDid] }),
        queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
        queryClient.invalidateQueries({ queryKey: ['useGetCredentialsPaginated'] }),
        queryClient.invalidateQueries({ queryKey: ['useGetIDs', profileDid] }),
    ];

    if (options?.includeCount !== false) {
        jobs.push(
            queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount', profileDid] })
        );
    }

    return Promise.all(jobs);
};
