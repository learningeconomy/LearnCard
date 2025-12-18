import React, { useState, useEffect } from 'react';
import { auth } from '../stores/nanoStores/authStore';

import { LCNProfile } from '@learncard/types';

import { useIsLoggedIn, useCurrentUser, switchedProfileStore } from 'learn-card-base';

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
