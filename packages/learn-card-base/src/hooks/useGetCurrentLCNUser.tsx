import { useEffect } from 'react';
import { auth } from '../stores/nanoStores/authStore';

import { useIsLoggedIn, useCurrentUser, switchedProfileStore } from 'learn-card-base';
import currentUserStore from 'learn-card-base/stores/currentUserStore';

import { useGetProfile } from 'learn-card-base';

export const useGetCurrentLCNUser = () => {
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();
    const hasParentSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const { data: profile, error, isLoading, refetch } = useGetProfile();

    useEffect(() => {
        if (!profile || !currentUser || !isLoggedIn || hasParentSwitchedProfiles) return;

        const lcnDisplayName = profile.displayName?.trim();
        const lcnImage = profile.image?.trim();

        // Only sync to currentUserStore when the LCN profile actually has data
        // for the field. Sparse / brand-new LCN profiles return empty strings
        // for displayName/image, and writing those back here used to wipe the
        // auth-provider-supplied name/profileImage out of currentUserStore —
        // degrading UserProfilePicture's fallback chain to a literal '#'.
        if (lcnDisplayName || lcnImage) {
            currentUserStore.set.updateCurrentUserNameAndImage(
                lcnDisplayName || currentUser.name || '',
                lcnImage || currentUser.profileImage || ''
            );
        }

        if (profile.did) {
            auth.set({ did: profile.did });
        }
    }, [profile, isLoggedIn, currentUser, hasParentSwitchedProfiles]);

    return {
        currentLCNUser: error ? null : profile ?? null,
        refetch,
        currentLCNUserLoading: isLoading,
    };
};

export default useGetCurrentLCNUser;
