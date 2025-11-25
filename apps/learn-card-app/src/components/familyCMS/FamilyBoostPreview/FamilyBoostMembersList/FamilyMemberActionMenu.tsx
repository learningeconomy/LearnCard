import React, { useEffect } from 'react';

import { IonSkeletonText, useIonModal } from '@ionic/react';

import PeaceSign from '../../../svgs/PeaceSign';
import QrCodeIcon from '../../../svgs/QrCodeIcon';
import SwitchAccountButton from '../../../learncard/SwitchAccountButton';
import AccountSwitcherModal from '../../../learncard/AccountSwitcherModal';
import ChildInviteModal from '../../../familyCMS/FamilyCMSInviteModal/ChildInviteModal/ChildInviteModal';
import LearnCardAppIcon from '../../../../assets/images/add-boost-icon-small.png';
import MyLearnCardModal, {
    MyLearnCardModalViewModeEnum,
} from '../../../learncard/MyLearnCardModal';
import ProfileIcon from '../../../svgs/ProfileIcon';

import { VC } from '@learncard/types';
import { FamilyMember } from '../../familyCMSState';
import {
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
    BrandingEnum,
    currentUserStore,
    ModalTypes,
    switchedProfileStore,
    useGetCurrentLCNUser,
    useGetManagedProfiles,
    useModal,
    UserProfilePicture,
} from 'learn-card-base';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { useHistory } from 'react-router-dom';
import { closeAll } from '../../../../helpers/uiHelpers';
import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

export enum MemberActionMenuEnum {
    viewProfile = 'viewProfile',
    boost = 'boost',
    leaveFamily = 'leaveFamily',
    removeFromFamily = 'removeFromFamily',
    deleteChild = 'deleteChild',
}

export const FamilyMemberActionMenu: React.FC<{
    credential: VC;
    user: FamilyMember;
    closeModal: () => void;
}> = ({ credential, user, closeModal }) => {
    const history = useHistory();
    const { newModal, closeAllModals } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const { data, isLoading } = useGetManagedProfiles(user?.did);
    const profile = data?.records?.[0];

    const { currentLCNUser } = useGetCurrentLCNUser();

    let currentUserIsActiveUser = user?.profileId === currentLCNUser?.profileId;

    const managedProfile = data?.records?.[0];
    const hasParentSwitchedProfiles = switchedProfileStore?.get?.isSwitchedProfile();

    if (hasParentSwitchedProfiles && managedProfile) {
        currentUserIsActiveUser = managedProfile?.did === currentLCNUser?.did;
    }

    const parent = currentUserStore?.get?.parentUser();

    const [presentInviteChild, dismissChildInvite] = useIonModal(ChildInviteModal, {
        handleCloseModal: () => dismissChildInvite(),
        familyName: credential?.name,
        handleSaveChildAccount: () => {},
    });

    const handleSwitchAccount = () => {
        newModal(
            <AccountSwitcherModal />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const handleBoost = () => {
        const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${BoostCategoryOptionsEnum.socialBadge}&boostSubCategoryType=${AchievementTypes.Aficionado}`;

        let link = baseLink;

        if (user.profileId) {
            link = `${baseLink}&otherUserProfileId=${user.profileId}`;
        }

        history.push(link);
        closeAllModals();
        closeAll();
    };

    const actionMenu: {
        id?: number;
        title?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
        type?: MemberActionMenuEnum;
    }[] = [
        {
            id: 1,
            title: 'View Profile',
            icon: <ProfileIcon className="text-grayscale-900" />,
            onClick: () => {
                // open LearnCardID Preview
                newModal(
                    <MyLearnCardModal
                        branding={BrandingEnum.learncard}
                        user={
                            currentUserIsActiveUser
                                ? undefined
                                : {
                                      ...profile,
                                      displayName: user?.displayName,
                                      image: user?.image,
                                      managerDid: user?.did,
                                  }
                        }
                        viewMode={
                            currentUserIsActiveUser ? undefined : MyLearnCardModalViewModeEnum.child
                        }
                        hideLogout
                        hideEdit={!currentUserIsActiveUser && user?.type === 'Guardian'}
                        hideShare={!currentUserIsActiveUser}
                    />,
                    {},
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
                closeModal();
            },
            type: MemberActionMenuEnum.viewProfile,
        },
        {
            id: 2,
            title: 'Boost',
            icon: <QrCodeIcon className="text-grayscale-900" />,
            onClick: () => {
                // open LearnCardID Preview
                handleBoost();
                closeModal();
                closeAllModals();
            },
            type: MemberActionMenuEnum.boost,
        },
    ];

    // hide options for mvp
    // if (user?.profileId === currentLCNUser?.profileId) {
    //     actionMenu.push({
    //         id: 4,
    //         title: `Leave Family`,
    //         icon: <PeaceSign className="text-grayscale-900" />,
    //         onClick: () => {
    //             // revoke credential
    //             closeModal();
    //         },
    //         type: MemberActionMenuEnum.leaveFamily,
    //     });
    // }

    // if (user?.type === 'Guardian' && user?.profileId !== currentLCNUser?.profileId) {
    //     actionMenu.push({
    //         id: 4,
    //         title: `Remove from Family`,
    //         icon: <PeaceSign className="text-grayscale-900" />,
    //         onClick: () => {
    //             // revoke credential
    //             closeModal();
    //         },
    //         type: MemberActionMenuEnum.removeFromFamily,
    //     });
    // }

    // if (user?.type === 'Child') {
    //     actionMenu.push({
    //         id: 3,
    //         title: `Delete Child`,
    //         icon: <PeaceSign className="text-grayscale-900" />,
    //         onClick: () => {
    //             // revoke credential
    //             closeModal();
    //         },
    //         type: MemberActionMenuEnum.deleteChild,
    //     });
    // }

    const name = user?.displayName ?? '';
    const profileID = user?.profileId;

    return (
        <div className="ion-padding">
            <div className="flex flex-col items-center justify-center mb-4">
                {isLoading ? (
                    <BoostSkeleton containerClassName="w-[80px] h-[80px] rounded-full" />
                ) : (
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center w-[80px] h-[80px] rounded-full overflow-hidden text-white font-medium text-4xl"
                        customImageClass="flex justify-center items-center w-[80px] h-[80px] rounded-full overflow-hidden object-cover"
                        customSize={120}
                        user={user}
                    />
                )}
                {isLoading ? (
                    <BoostSkeleton containerClassName="w-[200px] h-[20px] mt-2" />
                ) : (
                    <>
                        <h2 className="text-center w-full font-poppins text-2xl font-semibold text-grayscale-900 mt-2">
                            {name}
                        </h2>
                        {user?.profileId && (
                            <p className="text-center w-full font-poppins text-sm font-semibold text-grayscale-700">
                                @{profileID}
                            </p>
                        )}
                    </>
                )}

                {(currentUserIsActiveUser ||
                    (!hasParentSwitchedProfiles && user?.type === 'Child') ||
                    (hasParentSwitchedProfiles && user?.displayName === parent?.name)) && (
                    <div className="mt-4">
                        <SwitchAccountButton handleAccountSwitcher={handleSwitchAccount} />
                    </div>
                )}
            </div>
            <ul className="w-full flex flex-col items-center justify-center">
                {actionMenu?.map(action => {
                    const { id, title, icon, onClick, type } = action;

                    const showIcon = type !== MemberActionMenuEnum.boost;
                    const showImage = type === MemberActionMenuEnum.boost;

                    return (
                        <button
                            key={id}
                            onClick={() => onClick?.()}
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0"
                            disabled={isLoading}
                        >
                            <p
                                className={` ${
                                    isLoading ? 'text-grayscale-400' : 'text-grayscale-900'
                                }`}
                            >
                                {title}
                            </p>

                            {showIcon && icon}

                            {showImage && (
                                <div className="h-[30px] w-[30px] max-h-[30px] max-w-[30px]">
                                    <img src={LearnCardAppIcon} alt="learncard icon" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </ul>
        </div>
    );
};
export default FamilyMemberActionMenu;
