import { useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import useCurrentUser from './useGetCurrentUser';
import useGetCurrentLCNUser from './useGetCurrentLCNUser';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { cloneDeep } from 'lodash';

import { switchProfile } from 'learn-card-base/helpers/walletHelpers';
import { LCNProfile } from '@learncard/types';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';

export const useSwitchProfile = (options?: { onSwitch?: () => void }) => {
    const { onSwitch } = options ?? {};

    const flags = useFlags();
    const currentUser = useCurrentUser();
    const { currentLCNUser, refetch: refetchCurrentLCNUser } = useGetCurrentLCNUser();

    const isSwitchedProfile = switchedProfileStore?.use?.isSwitchedProfile();

    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitchBackToParentAccount = async () => {
        if (!isSwitchedProfile) return;

        setIsSwitching(true);

        try {
            const parentUser = currentUserStore.get.parentUser();

            await switchProfile();
            currentUserStore.set.updateCurrentUserNameAndImage(
                parentUser?.name,
                parentUser?.profileImage
            );
            currentUserStore.set.parentUser(null);
            currentUserStore.set.parentUserDid(null);
            currentUserStore.set.parentLDFlags(undefined);
            switchedProfileStore.set.profileType('parent');
            refetchCurrentLCNUser();
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
                currentUserStore.set.parentUser(currentUser);
                currentUserStore.set.parentUserDid(currentLCNUser?.did ?? null);
                currentUserStore.set.parentLDFlags(cloneDeep(flags));
            }

            await switchProfile(account?.did);
            if (account?.isServiceProfile) {
                switchedProfileStore.set.profileType('service');
            } else {
                switchedProfileStore.set.profileType('child');
            }

            currentUserStore.set.updateCurrentUserNameAndImage(
                account?.displayName,
                account?.image
            );
            await refetchCurrentLCNUser();
        } finally {
            setIsSwitching(false);
        }

        onSwitch?.();
    };

    return {
        handleSwitchAccount,
        handleSwitchBackToParentAccount,
        isSwitching,
    };
};
