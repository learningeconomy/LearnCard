import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VC } from '@learncard/types';
import { useGetProfile, useWallet } from 'learn-card-base';

export const useHighlightedCredentials = (profileId?: string, enabled: boolean = true) => {
    const { data: profile, isLoading: profileIsLoading } = useGetProfile(profileId, enabled);
    const { initWallet } = useWallet();

    const uris = useMemo(
        () => profile?.highlightedCredentials ?? [],
        [profile?.highlightedCredentials]
    );

    const query = useQuery<{ uris: string[]; credentials: VC[] }>({
        queryKey: ['resolvedHighlightedCredentials', profileId ?? '', uris],
        enabled: enabled && !profileIsLoading && uris.length > 0,
        queryFn: async () => {
            const wallet = await initWallet();
            const resolved = await Promise.all(
                uris.map(async uri => {
                    try {
                        const vc = (await wallet.invoke.resolveFromLCN(uri)) as VC | undefined;
                        return vc;
                    } catch {
                        return undefined;
                    }
                })
            );
            return { uris, credentials: resolved.filter(Boolean) as VC[] };
        },
    });
    const overallIsLoading = profileIsLoading || query.isLoading;

    return {
        uris,
        credentials: query.data?.credentials ?? [],
        isLoading: overallIsLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
};

export default useHighlightedCredentials;
