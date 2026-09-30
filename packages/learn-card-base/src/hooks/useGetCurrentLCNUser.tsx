import { useEffect } from 'react';
import { auth } from '../stores/nanoStores/authStore';

import { useIsLoggedIn, useCurrentUser } from 'learn-card-base';
import currentUserStore from 'learn-card-base/stores/currentUserStore';

import { useGetProfile } from 'learn-card-base';

export const useGetCurrentLCNUser = () => {
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();

    const { data: profile, error, isLoading, refetch } = useGetProfile();

    useEffect(() => {
        if (!profile || !currentUser || !isLoggedIn) return;

        const lcnDisplayName = profile.displayName?.trim();
        const lcnImage = profile.image?.trim();

        // The wallet's profile query is keyed by the switched DID, so its
        // identity also restores the selected organization after a page reload.
        // The auth coordinator initially populates name/image as empty strings.
        if (lcnDisplayName || lcnImage) {
            currentUserStore.set.updateCurrentUserNameAndImage(
                lcnDisplayName || currentUser.name || '',
                lcnImage || currentUser.profileImage || ''
            );
        }

        if (profile.did) {
            auth.set({ did: profile.did });
        }
    }, [profile, isLoggedIn, currentUser]);

    return {
        currentLCNUser: error ? null : (profile ?? null),
        refetch,
        currentLCNUserLoading: isLoading,
    };
};

export default useGetCurrentLCNUser;
