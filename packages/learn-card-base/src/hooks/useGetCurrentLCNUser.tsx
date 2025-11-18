import React, { useState, useEffect } from 'react';
import { auth } from '../stores/nanoStores/authStore';

import { LCNProfile } from '@learncard/types';

import { useIsLoggedIn, useCurrentUser, switchedProfileStore } from 'learn-card-base';

import { useGetProfile } from 'learn-card-base';

export const useGetCurrentLCNUser = () => {
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();
    const hasParentSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const { data: profile, error, refetch, isLoading: currentLCNUserLoading } = useGetProfile();

    const [lcnProfile, setLcnProfile] = useState<LCNProfile | null>(null);

    const loadLCNUser = async () => {
        if (profile) {
            setLcnProfile(profile);
            auth.set({ did: profile.did });
        }

        if (error) setLcnProfile(null);
    };

    useEffect(() => {
        if (currentUser && isLoggedIn) {
            loadLCNUser();
        }
    }, [hasParentSwitchedProfiles, lcnProfile, profile, currentLCNUserLoading]);

    return {
        currentLCNUser: lcnProfile,
        refetch,
        currentLCNUserLoading,
    };
};

export default useGetCurrentLCNUser;
