import { useGetResolvedCredentials } from 'learn-card-base/react-query/queries/vcQueries';
import { InfiniteData } from '@tanstack/react-query';
import { CredentialRecord, Boost } from '@learncard/types';
import { useResolveBoosts } from 'learn-card-base/react-query/queries/queries';
import { CredentialMetadata } from 'learn-card-base/types/credential-records';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
//  Client side search filtering of react query cache
// use for "Earned Boosts"
//  Takes an array of react query paginated records, eg useGetCredentialList
type QueryRecords =
    | InfiniteData<
          | {
                records: CredentialRecord<CredentialMetadata>[];
                hasMore: boolean;
                cursor?: string;
            }
          | undefined,
          unknown
      >
    | undefined;

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

export const searchCredentialsFromCache = (records: QueryRecords, searchInput?: string) => {
    let results = [];
    const searchString = credentialSearchStore.use.searchString() || '';
    const cachedCreds = useGetResolvedCredentials(
        records?.pages?.flatMap(page => page?.records?.map(record => record.uri))
    );

    const escapedSearchString = escapeRegExp(searchString);

    if (escapedSearchString) {
        const pattern = new RegExp(`${escapedSearchString}`, 'gi');
        // console.log('///resolved cachedCreds', cachedCreds);
        results = cachedCreds?.filter(cred => {
            // Matching cases:
            // matches 'normal boosts' eg boosts you make in LCA or Scouts
            if (cred?.data?.boostCredential?.name?.match(pattern)) return true;
            // matches 'non boost' credential (for example the creds from starfleet fall into this)
            if (cred?.data?.credentialSubject?.achievement?.name?.match(pattern)) return true;
            //matches 'clr credentials'
            if (cred?.data?.name?.match(pattern)) return true;

            return false;
        });
        // console.log('Filtered Credentials:', results);
    } else {
        // console.log('Search string is empty; returning all cachedCreds.');
        results = cachedCreds;
    }

    return results;
};

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

    // console.log('///cachedBoosts', cachedCreds);
    const escapedSearchString = escapeRegExp(searchString);

    if (escapedSearchString) {
        const pattern = new RegExp(`${escapedSearchString}`, 'gi');
        // console.log('///resolved cachedCreds', cachedCreds);
        results = cachedCreds?.filter(cred => {
            if (cred?.data?.name?.match(pattern)) return true;

            return false;
        });
        // console.log('Filtered Credentials:', results);
    } else {
        // console.log('Search string is empty; returning all cachedCreds.');
        results = cachedCreds;
    }

    return results;
};
