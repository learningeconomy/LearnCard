import React from 'react';

import {
    ModalTypes,
    switchedProfileStore,
    useGetManagedProfiles,
    useModal,
    UserProfilePicture,
} from 'learn-card-base';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import FamilyMemberActionMenu from './FamilyMemberActionMenu';

import { FamilyMember } from '../../familyCMSState';
import { VC } from '@learncard/types';

export const FamilyBoostMembersListItem: React.FC<{
    credential: VC;
    user: FamilyMember;
    currentUser?: FamilyMember;
    familyTitles?: {
        plural: string;
        singular: string;
    };
}> = ({ credential, user, currentUser, familyTitles }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { data } = useGetManagedProfiles(user?.did);

    let currentUserIsActiveUser = user?.profileId === currentUser?.profileId;

    const managedProfile = data?.records?.[0];

    if (switchedProfileStore.get.isSwitchedProfile() && managedProfile) {
        currentUserIsActiveUser = managedProfile?.did === currentUser?.did;
    }

    const handleMemberActionMenu = () => {
        newModal(
            <FamilyMemberActionMenu credential={credential} user={user} closeModal={closeModal} />,
            {},
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return (
        <div
            onClick={handleMemberActionMenu}
            className="flex items-center justify-between w-full bg-white border-t-grayscale-100 border-t-solid border-t-[2px] pb-[12px] pt-[12px]"
        >
            <div className="flex items-center justify-start w-full">
                <div className="flex items-center justify-start">
                    <UserProfilePicture
                        customContainerClass={`flex justify-center items-center w-[40px] h-[40px] rounded-full overflow-hidden text-white font-medium text-4xl mr-3 ${
                            currentUserIsActiveUser
                                ? 'border-emerald-700 border-solid border-2'
                                : ''
                        }`}
                        customImageClass="flex justify-center items-center w-[40px] h-[40px] rounded-full overflow-hidden object-cover"
                        customSize={120}
                        user={user}
                    />
                </div>
                <div className="flex flex-col items-start justify-center pt-1 pr-1 pb-1">
                    {currentUserIsActiveUser && (
                        <p className="text-emerald-700 text-xs font-semibold">Active User</p>
                    )}
                    <p className="text-grayscale-900 font-normal font-poppins">
                        {user?.displayName || user?.profileId}
                    </p>
                </div>
            </div>
            <button className="flex items-center justify-center text-grayscale-600 font-poppins text-sm">
                {familyTitles?.singular}
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </button>
        </div>
    );
};

export default FamilyBoostMembersListItem;
