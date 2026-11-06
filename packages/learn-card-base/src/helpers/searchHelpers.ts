import { InfiniteData } from '@tanstack/react-query';
import { Boost } from '@learncard/types';
import { useResolveBoosts } from 'learn-card-base/react-query/queries/queries';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
type ManagedBoostRecords =
    | InfiniteData<
          | {
                records: Boost[];
                hasMore: boolean;
                cursor?: string;
            }
          | undefined,
          unknown
      >
    | undefined;

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Used for client side searching/filtering managed boosts */
// use for "Managed Boosts"
// Takes an array of react query paginated records, eg useGetPaginatedManagedBoosts

export const searchManagedBoostsFromCache = (
    records: ManagedBoostRecords,
    searchInput?: string
) => {
    let results = [];
    const searchStringFromStore = credentialSearchStore.use.searchString();
    const searchString = searchInput || searchStringFromStore || '';

    const cachedCreds = useResolveBoosts(
        records?.pages?.flatMap(page => page?.records?.map(record => record.uri))
    );

    const escapedSearchString = escapeRegExp(searchString);

    if (escapedSearchString) {
        const pattern = new RegExp(`${escapedSearchString}`, 'gi');
        results = cachedCreds?.filter(cred => {
            if (cred?.data?.name?.match(pattern)) return true;

            return false;
        });
    } else {
        results = cachedCreds;
    }

    return results;
};
