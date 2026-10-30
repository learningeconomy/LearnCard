import { useMemo } from 'react';

import type { VC } from '@learncard/types';
import { useResolveBoosts } from 'learn-card-base';

import { selectFeaturedCredentialUris } from './featuredCredentialBubbles.helpers';

export type ResolvedFeaturedCredential = {
    uri: string;
    credential: VC;
};

/**
 * Resolves a profile's public `highlightedCredentials` (boost URIs) into displayable
 * credentials, preserving the owner's stored order. Each URI resolves independently, so a
 * selection that cannot be resolved (deleted, private, or unreachable) is simply omitted
 * instead of hiding the rest.
 */
export const useResolvedFeaturedCredentials = (
    uris: readonly (string | undefined)[] | undefined
): { credentials: ResolvedFeaturedCredential[]; isResolving: boolean } => {
    const selectedUris = useMemo(() => selectFeaturedCredentialUris(uris), [uris]);
    const results = useResolveBoosts(selectedUris);

    const credentials = results.flatMap(({ data, uri }) =>
        data && uri ? [{ uri, credential: data }] : []
    );
    const isResolving = results.some(result => result.isPending);

    return { credentials, isResolving };
};

export default useResolvedFeaturedCredentials;
