import React, { useState } from 'react';
import AddUser from '../../../svgs/AddUser';
import FamilyBoostMembersListItem from './FamilyBoostMemberListItem';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import FamilyBoostInviteModalOptions from '../FamilyBoostInviteModal/FamilyBoostInviteModalOptions';

import {
    ModalTypes,
    switchedProfileStore,
    useGetAdmins,
    useGetBoostChildrenProfileManagers,
    useGetCurrentLCNUser,
    useModal,
    UserProfilePicture,
} from 'learn-card-base';
import { useIonModal } from '@ionic/react';

import { VC } from '@learncard/types';
import { FamilyMembersListTabsEnum } from '../../FamilyCMSMembersList/FamilyCMSMembersList';

export const FamilyBoostMembersList: React.FC<{
    credential: VC;
    showMinified?: boolean;
    threeDotOnClick?: () => void;
}> = ({ credential, showMinified = false, threeDotOnClick }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { currentLCNUser } = useGetCurrentLCNUser();

    const [activeTab, setActiveTab] = useState<FamilyMembersListTabsEnum>(
        FamilyMembersListTabsEnum.all
    );

    const hasSwitedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const { data: guardians, isLoading: guardiansLoading } = useGetAdmins(credential?.boostId);
    const { data: dependents, isLoading: dependentsLoading } = useGetBoostChildrenProfileManagers(
        credential?.boostId
    );

    const guardianRecords =
        guardians?.records?.length > 0
            ? guardians?.records?.map(g => {
                  return {
                      ...g,
                      type: 'Guardian',
                  };
              })
            : [];

    const dependentRecords =
        dependents?.records?.length > 0
            ? dependents?.records?.map(d => {
                  return {
                      ...d,
                      type: 'Child',
                  };
              })
            : [];

    let guardiansAndDependents = [...(guardianRecords ?? []), ...(dependentRecords ?? [])];
    if (activeTab === FamilyMembersListTabsEnum.guardian) guardiansAndDependents = guardianRecords;
    if (activeTab === FamilyMembersListTabsEnum.child) guardiansAndDependents = dependentRecords;

    const guardiansCount: number = guardianRecords?.length || 0;
    const childrenCount: number = dependentRecords?.length || 0;
    const totalMembersCount: number = guardiansCount + childrenCount || 0;

    const familyTitles = credential?.familyTitles;
    const guardianTitle = familyTitles?.guardians;
    const dependentTitle = familyTitles?.dependents;

    if (showMinified) {
        return (
            <section className="flex justify-center items-center text-center text-[14px] overflow-hidden text-grayscale-500 px-[4px] py-2">
                {guardiansAndDependents?.slice(0, 5)?.map((recipient, index) => {
                    return (
                        <div
                            key={index}
                            className="profile-thumb-img border-[1px] border-white border-solid  vc-issuee-image h-[40px] w-[40px] rounded-full overflow-hidden mx-[-5px] z-10"
                        >
                            <UserProfilePicture
                                customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-2xl mr-3"
                                customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                                user={recipient}
                            />
                        </div>
                    );
                })}
                {totalMembersCount > 4 && (
                    <button
                        onClick={() => threeDotOnClick?.()}
                        className="ml-1 w-[25px] h-[25px] rounded-full overflow-hidden flex items-center justify-center z-10"
                    >
                        <ThreeDots className="w-[20px] h-auto text-grayscale-900" version="2" />
                    </button>
                )}
            </section>
        );
    }

    return (
        <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
            <div className="w-full flex items-start justify-center flex-col">
                <div className="w-full flex items-center justify-between">
                    <h3 className="font-poppins text-xl font-normal text-grayscale-800">
                        {totalMembersCount} Members
                    </h3>

                    {!hasSwitedProfiles && (
                        <button
                            onClick={() => {
                                newModal(
                                    <FamilyBoostInviteModalOptions
                                        credential={credential}
                                        handleCloseModal={() => closeModal()}
                                    />
                                );
                            }}
                            className="bg-yellow-400 flex items-center justify-center p-[6px] rounded-full w-[35px] h-[35px] min-w-[35px] min-h-[35px]"
                        >
                            <AddUser className="text-white w-[25px] h-auto" fill="white" />
                        </button>
                    )}
                </div>

                <div className="flex mb-2 mt-2">
                    <button
                        onClick={() => setActiveTab(FamilyMembersListTabsEnum.all)}
                        className={`text-sm font-poppins font-semibold mr-2 ${
                            activeTab === FamilyMembersListTabsEnum.all
                                ? 'text-emerald-700'
                                : 'text-grayscale-700'
                        }`}
                    >
                        All
                    </button>

                    {childrenCount > 0 && (
                        <button
                            onClick={() => setActiveTab(FamilyMembersListTabsEnum.child)}
                            className={`text-sm font-poppins font-semibold mr-2  ${
                                activeTab === FamilyMembersListTabsEnum.child
                                    ? 'text-emerald-700'
                                    : 'text-grayscale-700'
                            }`}
                        >
                            {childrenCount}{' '}
                            {childrenCount === 1
                                ? dependentTitle?.singular
                                : dependentTitle?.plural}
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab(FamilyMembersListTabsEnum.guardian)}
                        className={`text-sm font-poppins font-semibold mr-2  ${
                            activeTab === FamilyMembersListTabsEnum.guardian
                                ? 'text-emerald-700'
                                : 'text-grayscale-700'
                        }`}
                    >
                        {guardiansCount}{' '}
                        {guardiansCount === 1 ? guardianTitle?.singular : guardianTitle?.plural}
                    </button>
                </div>

                <div className="mt-1 w-full">
                    {guardiansAndDependents?.map(user => {
                        let _familyTitles =
                            user?.type === 'Guardian' ? guardianTitle : dependentTitle;

                        return (
                            <FamilyBoostMembersListItem
                                credential={credential}
                                key={user?.profileId}
                                user={user}
                                currentUser={currentLCNUser}
                                familyTitles={_familyTitles}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FamilyBoostMembersList;
