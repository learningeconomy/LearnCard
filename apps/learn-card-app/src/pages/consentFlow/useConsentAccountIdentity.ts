import { useQuery } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useGetCurrentLCNUser from 'learn-card-base/hooks/useGetCurrentLCNUser';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';

export const useConsentAccountIdentity = () => {
    const currentUser = useCurrentUser();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const profileId = currentLCNUser?.profileId;
    const { data: managedIdentity, isLoading: managedIdentityLoading } = useQuery({
        queryKey: ['getAvailableProfiles', '', { profileId }],
        enabled:
            !!switchedDid &&
            !!profileId &&
            (!currentLCNUser?.displayName || !currentLCNUser?.image),
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            // Family names/photos live on the manager record, not the child's public profile.
            const parentWallet = await initWallet(undefined, true);
            const profiles = await parentWallet.invoke.getAvailableProfiles({
                query: { profileId },
                limit: 1,
            });
            return (
                profiles.records.find(record => record.profile.profileId === profileId)?.manager ??
                null
            );
        },
    });
    const displayName =
        currentLCNUser?.displayName || managedIdentity?.displayName || currentUser?.name;
    const image = currentLCNUser?.image || managedIdentity?.image || currentUser?.profileImage;

    return {
        displayName,
        image,
        profileId,
        isLoading: !displayName && (currentLCNUserLoading || managedIdentityLoading),
    };
};
