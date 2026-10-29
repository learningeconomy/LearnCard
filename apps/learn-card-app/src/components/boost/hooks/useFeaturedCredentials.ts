import { useMutation, useQueryClient } from '@tanstack/react-query';

import { switchedProfileStore, useGetProfile, useWallet } from 'learn-card-base';

import { persistQueryCacheNow } from '../../../helpers/queryPersistence';
import {
    addFeaturedCredential,
    hasFeaturedCapacity,
    isCredentialFeatured,
    normalizeFeaturedCredentialUris,
    removeFeaturedCredential,
} from '../boost-options-menu/featuredCredentials.helpers';

/** Thrown when a feature request would exceed the profile's featured credential limit. */
export class FeaturedCredentialsLimitError extends Error {
    constructor() {
        super('The profile already features the maximum number of credentials');
        this.name = 'FeaturedCredentialsLimitError';
    }
}

const EMPTY_FEATURED_URIS: readonly string[] = [];

/**
 * Reads and updates the current profile's public `highlightedCredentials` selection.
 *
 * Writes go through `wallet.invoke.updateProfile` and then refresh the own-profile query
 * cache the same way the profile editor does, so every `useGetProfile()` consumer sees
 * the new selection without waiting for the five minute stale window.
 */
export const useFeaturedCredentials = () => {
    const { data: profile } = useGetProfile();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const storedUris = profile?.highlightedCredentials ?? EMPTY_FEATURED_URIS;
    const featuredUris = normalizeFeaturedCredentialUris(storedUris);

    const persistFeaturedCredentials = async (highlightedCredentials: string[]) => {
        const switchedDid = switchedProfileStore.get.switchedDid() ?? '';
        const wallet = await initWallet();

        const updated = await wallet.invoke.updateProfile({ highlightedCredentials });
        if (!updated) throw new Error('Network profile update failed');

        // updateProfile refreshes this wallet's private self-profile cache. Read that
        // same instance instead of refetching through a potentially replaced wallet.
        const savedProfile = await wallet.invoke.getProfile();
        if (!savedProfile) throw new Error('Updated network profile is unavailable');

        const ownProfileKey = ['getProfile', switchedDid, undefined];
        await queryClient.cancelQueries({
            predicate: query =>
                query.queryKey[0] === 'getProfile' &&
                ((query.queryKey[1] === switchedDid && !query.queryKey[2]) ||
                    query.queryKey[2] === savedProfile.profileId),
        });
        queryClient.setQueryData(ownProfileKey, savedProfile);
        // Public lookups must refetch without copying private self-profile fields.
        await queryClient.invalidateQueries({
            predicate: query =>
                query.queryKey[0] === 'getProfile' && query.queryKey[2] === savedProfile.profileId,
        });
        // Query invalidation does not wait for the throttled disk write. Do not
        // announce success until reload can hydrate the saved selection.
        await persistQueryCacheNow(queryClient);

        return savedProfile.highlightedCredentials ?? [];
    };

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async ({ uri, action }: { uri: string; action: 'feature' | 'unfeature' }) => {
            const current = featuredUris;
            const selectionIsNormalized = current.length === storedUris.length;

            if (action === 'unfeature') {
                const next = removeFeaturedCredential(current, uri);

                return selectionIsNormalized && next.length === current.length
                    ? current
                    : persistFeaturedCredentials(next);
            }

            const next = addFeaturedCredential(current, uri);
            if (!next) throw new FeaturedCredentialsLimitError();

            return selectionIsNormalized && next.length === current.length
                ? current
                : persistFeaturedCredentials(next);
        },
    });

    return {
        /** Ordered boost URIs currently featured on the public profile. */
        featuredUris,
        /** False until the network profile is known; users without one cannot feature. */
        hasProfile: Boolean(profile?.profileId),
        isUpdating: isPending,
        isFeatured: (uri: string): boolean => isCredentialFeatured(featuredUris, uri),
        canFeatureMore: hasFeaturedCapacity(featuredUris),
        featureCredential: (uri: string): Promise<readonly string[]> =>
            mutateAsync({ uri, action: 'feature' }),
        unfeatureCredential: (uri: string): Promise<readonly string[]> =>
            mutateAsync({ uri, action: 'unfeature' }),
    };
};

export default useFeaturedCredentials;
