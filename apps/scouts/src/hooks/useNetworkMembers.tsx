import { useInfiniteQuery } from '@tanstack/react-query';
import { CredentialCategoryEnum, useWallet } from 'learn-card-base';

import { PaginationOptionsType } from '@learncard/types';

const useNetworkMembers = (
    boostUri: string,
    profileSearchString?: string,
    initialOptions: PaginationOptionsType = { limit: 10 }
) => {
    const { initWallet } = useWallet();

    return useInfiniteQuery({
        queryKey: ['useNetworkMembers', boostUri, profileSearchString, initialOptions.limit],
        queryFn: async ({ pageParam }) => {
            console.log('[ScoutsApp] useNetworkMembers fetching for URI:', boostUri);
            const wallet = await initWallet();
            const options = { ...initialOptions, cursor: pageParam as string | undefined };

            return wallet.invoke.getPaginatedBoostRecipientsWithChildren(
                boostUri,
                options.limit,
                options.cursor,
                undefined,
                {
                    category: {
                        $in: [
                            CredentialCategoryEnum.nationalNetworkAdminId,
                            CredentialCategoryEnum.troopLeaderId,
                            CredentialCategoryEnum.scoutId,
                        ],
                    },
                },
                profileSearchString
                    ? {
                          displayName: { $regex: new RegExp(profileSearchString, 'i') },
                      }
                    : undefined,
                // $or doesn't seem like it's supported, so we're just filtering by displayName
                // profileSearchString
                //     ? {
                //           $or: [
                //               {
                //                   profileId: { $regex: new RegExp(profileSearchString, 'i') },
                //               },
                //               {
                //                   displayName: { $regex: new RegExp(profileSearchString, 'i') },
                //               },
                //           ],
                //       }
                //     : undefined,
                2
            );
        },
        initialPageParam: initialOptions.cursor,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage.cursor : undefined),
        enabled: Boolean(boostUri),
    });
};

export default useNetworkMembers;
