import React from 'react';

import CaretDown from 'learn-card-base/svgs/CaretDown';
import AccountSwitcherModal from '../../../components/learncard/AccountSwitcherModal';

import {
    ProfilePicture,
    useCurrentUser,
    switchedProfileStore,
    useModal,
    useGetCurrentLCNUser,
    ModalTypes,
} from 'learn-card-base';
import { getProfileTypeDisplayText } from './admin-tools-switcher.helpers';

export const AdminToolsAccountSwitcherButton: React.FC<{ showServiceProfilesOnly?: boolean }> = ({
    showServiceProfilesOnly,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();

    const profileTypeDisplayText = getProfileTypeDisplayText(profileType);

    return (
        <button
            onClick={() =>
                newModal(
                    <AccountSwitcherModal
                        showServiceProfiles
                        containerClassName="max-h-[70vh]"
                        showStepsFooter
                        showServiceProfilesOnly={showServiceProfilesOnly}
                    />,
                    {
                        sectionClassName:
                            '!bg-transparent !border-none !shadow-none !max-w-[400px]',
                        hideButton: true,
                    }
                )
            }
            className="w-full rounded-full pl-[2px] pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-100 bg-grayscale-100 mt-4 mb-4"
        >
            <div className="flex items-center justify-start">
                <div className="w-[40px] h-[40px] rounded-full bg-grayscale-100 mr-2 overflow-hidden">
                    <ProfilePicture
                        customSize={120}
                        customContainerClass="w-[40px] h-[40px]"
                        customImageClass="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col items-start justify-center">
                    <h4 className="text-grayscale-800 text-left text-[17px]">
                        {currentLCNUser?.displayName || currentUser?.name}
                    </h4>

                    <p className="text-grayscale-600 font-bold text-left text-xs">
                        {profileTypeDisplayText}
                    </p>
                </div>
            </div>
            <CaretDown className="w-[20px] h-[20px] text-grayscale-800" />
        </button>
    );
};

export default AdminToolsAccountSwitcherButton;
