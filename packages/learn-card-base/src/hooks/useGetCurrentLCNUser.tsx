import React, { useState, useEffect } from 'react';
import { auth } from '../stores/nanoStores/authStore';

import { LCNProfile } from '@learncard/types';

import { useIsLoggedIn, useCurrentUser, switchedProfileStore } from 'learn-card-base';
import currentUserStore from 'learn-card-base/stores/currentUserStore';

import { useGetProfile } from 'learn-card-base';

export const useGetCurrentLCNUser = () => {
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();
    const hasParentSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();

    // Initial cached profile (wallet.invoke.getProfile without profileId returns cached userData)
    const {
        data: cachedProfile,
        error,
        isLoading: cachedLoading,
        refetch: refetchCached,
    } = useGetProfile();

    // Force a fresh fetch by querying the current profile by profileId
    const profileId = cachedProfile?.profileId;
    const {
        data: freshProfile,
        isLoading: freshLoading,
        refetch: refetchFresh,
    } = useGetProfile(profileId, Boolean(profileId));

    const [lcnProfile, setLcnProfile] = useState<LCNProfile | null>(null);

    const loadLCNUser = async () => {
        const next = freshProfile ?? cachedProfile ?? null;
        if (next) {
            setLcnProfile(next);
            auth.set({ did: next.did });

            // Only sync LCN profile data to currentUserStore when viewing your own profile.
            // For child profiles, the public LCN profile has empty displayName/image for privacy,
            // so we don't want to overwrite the manager's display data stored in currentUserStore.
            if (!hasParentSwitchedProfiles) {
                currentUserStore.set.updateCurrentUserNameAndImage(
                    next.displayName ?? '',
                    next.image ?? ''
                );
            }
        }

        if (error) setLcnProfile(null);
    };

    useEffect(() => {
        if (currentUser && isLoggedIn) {
            loadLCNUser();
        }
    }, [
        hasParentSwitchedProfiles,
        cachedProfile,
        freshProfile,
        cachedLoading,
        freshLoading,
        isLoggedIn,
        currentUser,
    ]);

    return {
        currentLCNUser: lcnProfile,
        refetch: refetchFresh ?? refetchCached,
        currentLCNUserLoading: cachedLoading || freshLoading,
    };
};

export default useGetCurrentLCNUser;
