import React from 'react';

import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

import {
    switchedProfileStore,
    currentUserStore,
    UserProfilePicture,
    useGetCurrentLCNUser,
} from 'learn-card-base';

import { getProfileTypeDisplayText } from '../../pages/adminToolsPage/AdminToolsAccountSwitcher/admin-tools-switcher.helpers';
import { LCNProfile } from '@learncard/types';

type ActiveChildAccountButtonProps = {
    handlePlayerSwitchOverride?: (user: LCNProfile) => void;
    onPlayerSwitch?: (user: LCNProfile) => void;
};

const ActiveChildAccountButton: React.FC<ActiveChildAccountButtonProps> = ({
    handlePlayerSwitchOverride,
    onPlayerSwitch,
}) => {
    const currentUser = currentUserStore.get.currentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const hasParentSwitchedProfiles = switchedProfileStore?.use?.isSwitchedProfile();

    if (!hasParentSwitchedProfiles) return <></>;

    const isSelected = hasParentSwitchedProfiles;
    const displayName = currentLCNUser?.displayName || currentUser?.name;
    const image = currentLCNUser?.image || currentUser?.profileImage;

    const profileTypeDisplayText = getProfileTypeDisplayText(profileType);

    const handleClick = () => {
        if (!currentLCNUser) return;

        const userToSwitch = {
            ...currentLCNUser,
            displayName: displayName || '',
            image: image || '',
        };

        handlePlayerSwitchOverride?.(userToSwitch);
        onPlayerSwitch?.(userToSwitch);
    };

    return (
        <button onClick={handleClick} className="flex flex-col gap-[5px] items-center">
            <UserProfilePicture
                customContainerClass={`flex justify-center items-center w-[86px] h-[86px] max-w-[86px] max-h-[86px] rounded-full overflow-hidden text-white font-medium text-4xl shrink-0 ${
                    isSelected ? 'border-[3px] border-solid border-emerald-700' : ''
                }`}
                customImageClass="flex justify-center items-center w-[86px] h-[86px] max-w-[86px] max-h-[86px] rounded-full overflow-hidden object-cover shrink-0"
                customSize={120}
                user={{ displayName, image }}
            />

            <div className="flex flex-col items-center">
                <p
                    className={`text-sm capitalize font-medium ${
                        isSelected ? 'text-grayscale-900' : 'text-grayscale-600 '
                    }`}
                >
                    {displayName}
                </p>
                <p className="text-xs text-grayscale-600 font-semibold capitalize">
                    {profileTypeDisplayText}
                </p>
                <div className="h-[15px] w-[15px]">
                    {isSelected && <CircleCheckmark className="h-[15px] w-[15px]" />}
                </div>
            </div>
        </button>
    );
};

export default ActiveChildAccountButton;
