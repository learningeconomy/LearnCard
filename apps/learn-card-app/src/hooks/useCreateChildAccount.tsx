import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    BoostCategoryOptionsEnum,
    getNotificationsEndpoint,
    switchedProfileStore,
    useCurrentUser,
    useWallet,
} from 'learn-card-base';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { sendBoostCredential } from '../components/boost/boostHelpers';
import { v4 as uuidv4 } from 'uuid';
import { LCNProfile } from '@learncard/types';
import { LearnCardRolesEnum } from '../components/onboarding/onboarding.helpers';

export const useCreateChildAccount = () => {
    const DEFAULT_LEARNCARD_WALLPAPER = 'https://cdn.filestackcontent.com/ImEqbxSFRESCRdkhQKY8';
    const DEFAULT_LEARNCARD_ID_WALLPAPER = 'https://cdn.filestackcontent.com/9Bgaim1ShGYSFgUBB2hn';
    const DEFAULT_COLOR_DARK = '#353E64';
    const DEFAULT_COLOR_LIGHT = '#EFF0F5';

    const currentUser = useCurrentUser();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ childAccount, boostUri }: { childAccount: any; boostUri: string }) => {
            const wallet = await initWallet();

            try {
                const managerDid = await wallet.invoke.createChildProfileManager(boostUri, {
                    displayName: childAccount?.name,
                    bio: childAccount?.shortBio,
                    image: childAccount?.image,
                });

                const managerLc = await getBespokeLearnCard(currentUser?.privateKey, managerDid);

                const learnCardDisplayStyles = childAccount?.learnCardID;

                const childDid = await managerLc.invoke.createManagedProfile({
                    profileId: childAccount.profileId, // uuid
                    displayName: '',
                    bio: '',
                    shortBio: '',
                    role: LearnCardRolesEnum.learner,
                    notificationsWebhook: getNotificationsEndpoint(),
                    display: {
                        // container styles
                        backgroundColor:
                            learnCardDisplayStyles?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                        backgroundImage:
                            learnCardDisplayStyles?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                        fadeBackgroundImage: learnCardDisplayStyles?.fadeBackgroundImage ?? false,
                        repeatBackgroundImage:
                            learnCardDisplayStyles?.repeatBackgroundImage ?? false,

                        // id styles
                        fontColor: learnCardDisplayStyles?.fontColor ?? DEFAULT_COLOR_LIGHT,
                        accentColor: learnCardDisplayStyles?.accentColor ?? '#ffffff',
                        accentFontColor: learnCardDisplayStyles?.accentFontColor ?? '',
                        idBackgroundImage:
                            learnCardDisplayStyles?.idBackgroundImage ??
                            DEFAULT_LEARNCARD_ID_WALLPAPER,
                        fadeIdBackgroundImage: learnCardDisplayStyles?.dimIdBackgroundImage ?? true,
                        idBackgroundColor: learnCardDisplayStyles?.idBackgroundColor ?? '#2DD4BF',
                        repeatIdBackgroundImage:
                            learnCardDisplayStyles?.repeatIdBackgroundImage ?? false,
                    },
                });

                const childLc = await getBespokeLearnCard(currentUser?.privateKey, childDid);

                // handle boosting someone else
                const { sentBoostUri } = await sendBoostCredential(
                    wallet,
                    childAccount?.profileId,
                    boostUri,
                    { skipNotification: true }
                );

                await childLc.index['LearnCloud'].add({
                    id: uuidv4(),
                    uri: sentBoostUri,
                    category: BoostCategoryOptionsEnum.family,
                });

                await wallet.invoke.removeBoostAdmin(boostUri, childAccount?.profileId!);

                return { success: true, childDid, childLc, managerLc };
            } catch (e) {
                console.error('handleCreateChildAccount', e);
                throw new Error('Failed to create child account');
            }
        },
        onMutate: async ({ childAccount, boostUri }) => {
            const childrenProfileManagersQueryKey = ['getBoostChildrenProfileManagers', boostUri];

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({
                queryKey: childrenProfileManagersQueryKey,
            });

            // Get snapshot of previous value
            const previousData = queryClient.getQueryData(childrenProfileManagersQueryKey);

            // Create temporary DID for optimistic update
            const tempDid = `temp-${uuidv4()}`;

            // Optimistically update the cache
            queryClient.setQueryData(
                childrenProfileManagersQueryKey,
                (old: { hasMore: boolean; cursor: string; records: LCNProfile[] } | undefined) => {
                    console.log('onMutate::', old);

                    const newRecord = {
                        did: tempDid,
                        bio: childAccount?.shortBio,
                        displayName: childAccount?.name,
                        image: childAccount?.image,
                        id: 'f93de53f-20e7-4247-8b00-d7ae58c13dc5',
                    };

                    if (!old) {
                        return {
                            hasMore: false,
                            cursor: '',
                            records: [newRecord],
                        };
                    }

                    return {
                        ...old,
                        records: [newRecord, ...old.records],
                    };
                }
            );

            // Return context for rollback
            return { previousData, tempDid, boostUri };
        },
        onSuccess: async (data, variables, context) => {
            const switchedDid = switchedProfileStore.get.switchedDid();
            const childrenProfileManagersQueryKey = [
                'getBoostChildrenProfileManagers',
                variables?.boostUri,
            ];
            const availableProfilesQueryKey = ['getAvailableProfiles', switchedDid ?? ''];

            // Invalidate the query
            queryClient.invalidateQueries({
                queryKey: childrenProfileManagersQueryKey,
            });
            queryClient.invalidateQueries({
                queryKey: availableProfilesQueryKey,
            });

            // Update the temporary record with the real DID
            queryClient.setQueryData(
                childrenProfileManagersQueryKey,
                (old: { hasMore: boolean; cursor: string; records: LCNProfile[] } | undefined) => {
                    if (!old) return old;

                    return {
                        ...old,
                        records: old.records.map(record =>
                            record.did === context?.tempDid
                                ? { ...record, did: data.managerDid }
                                : record
                        ),
                    };
                }
            );
        },
        onSettled: (_, __, { boostUri }) => {
            // Refetch after error or success
            queryClient.invalidateQueries({
                queryKey: ['getBoostChildrenProfileManagers', boostUri],
            });
        },
    });
};
