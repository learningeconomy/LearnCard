import React from 'react';

import usePin from '../../hooks/usePin';
import LockSimple from 'learn-card-base/svgs/LockSimple';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

import {
    useModal,
    useGetCurrentLCNUser,
    switchedProfileStore,
    currentUserStore,
    UserProfilePicture,
} from 'learn-card-base';

import { LCNProfile } from '@learncard/types';

type ParentSwitcherButtonProps = {
    isSwitching: boolean;
    onPlayerSwitch?: (user: LCNProfile) => void;
    handlePlayerSwitchOverride?: (user: LCNProfile) => void;
};

const ParentSwitcherButton: React.FC<ParentSwitcherButtonProps> = ({
    isSwitching,
    onPlayerSwitch,
    handlePlayerSwitchOverride,
}) => {
    const { closeModal } = useModal();
    const { handleVerifyParentPin, isSwitching: _isParentSwitching } = usePin(user => {
        onPlayerSwitch?.(user);
        closeModal();
    });

    let currentUser = currentUserStore.get.currentUser();
    const hasParentSwitchedProfiles = switchedProfileStore?.use?.isSwitchedProfile();

    if (hasParentSwitchedProfiles) currentUser = currentUserStore.get.parentUser();

    const { currentLCNUser } = useGetCurrentLCNUser();
    const isServiceProfile = currentLCNUser?.isServiceProfile;

    const handleClick = async () => {
        if (handlePlayerSwitchOverride) {
            await handlePlayerSwitchOverride(currentLCNUser);
        } else {
            await handleVerifyParentPin({ ignorePin: isServiceProfile });
        }
    };

    const isSelected = !hasParentSwitchedProfiles;
    const displayName = currentUser?.name;
    const image = currentUser?.profileImage;

    return (
        <button
            onClick={handleClick}
            className="flex flex-col gap-[5px] items-center disabled:opacity-60"
            disabled={isSwitching || _isParentSwitching}
        >
            <UserProfilePicture
                customContainerClass={`flex justify-center items-center w-[86px] h-[86px] max-w-[86px] max-h-[86px] shrink-0 rounded-full overflow-hidden text-white font-medium text-4xl ${
                    isSelected ? 'border-[3px] border-solid border-emerald-700' : ''
                }`}
                customImageClass="flex justify-center items-center w-[86px] h-[86px] max-w-[86px] max-h-[86px] rounded-full overflow-hidden object-cover shrink-0"
                customSize={120}
                user={{ displayName: displayName, image }}
            />

            <div className="flex flex-col items-center">
                <p
                    className={`text-sm font-medium capitalize ${
                        isSelected ? 'text-grayscale-900' : 'text-grayscale-600 '
                    }`}
                >
                    {displayName}
                </p>
                <p className="text-xs capitalize text-grayscale-600 font-semibold">User</p>
                <div className="h-[15px] w-[15px]">
                    {isSelected && <CircleCheckmark className="h-[15px] w-[15px]" />}
                    {!isSelected && !isServiceProfile && (
                        <LockSimple className="h-[15px] w-[15px] text-grayscale-600" />
                    )}
                </div>
            </div>
        </button>
    );
};

export default ParentSwitcherButton;
