import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFlags } from 'launchdarkly-react-client-sdk';
import useGetCurrentLCNUser from './useGetCurrentLCNUser';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { cloneDeep } from 'lodash';

import { switchProfile } from 'learn-card-base/helpers/walletHelpers';
import type { LCNProfile } from '@learncard/types';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';

export const useSwitchProfile = (options?: { onSwitch?: () => void }) => {
    const { onSwitch } = options ?? {};
    const queryClient = useQueryClient();
    const flags = useFlags();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();
    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitchBackToParentAccount = async () => {
        if (!isSwitchedProfile) return;
        setIsSwitching(true);
        try {
            const parentUser = currentUserStore.get.parentUser();
            const cachedParent = queryClient.getQueryData<LCNProfile>([
                'getProfile',
                '',
                undefined,
            ]);
            const parentProfile =
                cachedParent?.did === currentUserStore.get.parentUserDid()
                    ? cachedParent
                    : undefined;
            await switchProfile();
            currentUserStore.set.updateCurrentUserNameAndImage(
                parentProfile?.displayName || parentUser?.name || '',
                parentProfile?.image || parentUser?.profileImage || ''
            );
            currentUserStore.set.parentUser(null);
            currentUserStore.set.parentUserDid(null);
            currentUserStore.set.parentLDFlags(undefined);
            switchedProfileStore.set.profileType('parent');
            // Refresh the destination observer without delaying a completed wallet switch.
            void queryClient.invalidateQueries({
                queryKey: ['getProfile', '', undefined],
                exact: true,
            });
            queryClient.invalidateQueries({ queryKey: ['developer', 'isAdmin'] });
        } finally {
            setIsSwitching(false);
        }
        onSwitch?.();
    };

    const handleSwitchAccount = async (account: LCNProfile) => {
        setIsSwitching(true);
        try {
            const parentUser = currentUserStore.get.parentUser();
            if (!parentUser) {
                const activeUser = currentUserStore.get.currentUser();
                // Persist a plain snapshot, including the avatar currently shown by the network.
                currentUserStore.set.parentUser(
                    activeUser
                        ? {
                              ...activeUser,
                              name: currentLCNUser?.displayName || activeUser.name,
                              profileImage: currentLCNUser?.image || activeUser.profileImage,
                          }
                        : null
                );
                currentUserStore.set.parentUserDid(currentLCNUser?.did ?? null);
                currentUserStore.set.parentLDFlags(cloneDeep(flags));
            }
            await switchProfile(account.did);
            switchedProfileStore.set.profileType(account.isServiceProfile ? 'service' : 'child');
            currentUserStore.set.updateCurrentUserNameAndImage(account.displayName, account.image);
            // A retained source observer still owns the old account's query key.
            void queryClient.invalidateQueries({
                queryKey: ['getProfile', account.did, undefined],
                exact: true,
            });
            queryClient.invalidateQueries({ queryKey: ['developer', 'isAdmin'] });
        } finally {
            setIsSwitching(false);
        }
        onSwitch?.();
    };

    return { handleSwitchAccount, handleSwitchBackToParentAccount, isSwitching };
};
