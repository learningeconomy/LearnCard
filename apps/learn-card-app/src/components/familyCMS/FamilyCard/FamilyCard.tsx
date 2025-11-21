import React from 'react';
import { VC } from '@learncard/types';

import { useIonModal } from '@ionic/react';

import FamilyCrest from '../FamilyCrest/FamilyCrest';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';
import AddUser from '../../svgs/AddUser';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import FamilyBoostPreview from '../FamilyBoostPreview/FamilyBoostPreview';
import FamilyCardSkeleton from './FamilyCardSkeleton';
import FamilyBoostMembersList from '../FamilyBoostPreview/FamilyBoostMembersList/FamilyBoostMembersList';
import FamilyBoostInviteModalOptions from '../FamilyBoostPreview/FamilyBoostInviteModal/FamilyBoostInviteModalOptions';
import ShareBoostLink from '../../boost/boost-options-menu/ShareBoostLink';
import FamilyActionMenu from '../FamilyActionMenu/FamilyActionMenu';

import {
    BoostCategoryOptionsEnum,
    ModalTypes,
    switchedProfileStore,
    useGetAdmins,
    useGetBoostChildrenProfileManagers,
    useGetBoostPermissions,
    useModal,
} from 'learn-card-base';

type FamilyCardProps = {
    showSkeleton?: boolean;
    credential: VC;
    boostUri?: string;
};

export const FamilyCard: React.FC<FamilyCardProps> = ({ showSkeleton, credential, boostUri }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { data: guardians, isLoading: guardiansLoading } = useGetAdmins(credential?.boostId);
    const { data: dependents, isLoading: dependentsLoading } = useGetBoostChildrenProfileManagers(
        credential?.boostId
    );

    const { data: permissions } = useGetBoostPermissions(credential?.boostId);

    const hasParentSwitchedProfiles = switchedProfileStore?.get?.isSwitchedProfile();

    const [presentFamilyPreview, dismissFamilyPreview] = useIonModal(FamilyBoostPreview, {
        handleCloseModal: () => dismissFamilyPreview(),
        credential: credential,
        boostUri: boostUri,
    });

    const presentInviteModal = () => {
        newModal(
            <FamilyBoostInviteModalOptions
                credential={credential}
                handleCloseModal={() => closeModal()}
            />
        );
    };

    const presentShareBoostLink = () => {
        const shareBoostLinkModalProps = {
            handleClose: () => closeModal(),
            boost: credential,
            boostUri: boostUri,
            categoryType: BoostCategoryOptionsEnum.family,
        };

        newModal(
            <ShareBoostLink {...shareBoostLinkModalProps} />,
            {},
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
        );
    };

    const guardiansCount: number = guardians?.records?.length || 0;
    const childrenCount: number = dependents?.records?.length || 0;
    const totalMembersCount: number = guardiansCount + childrenCount || 0;

    const thumbnail = credential?.image;
    const backgroundImage = credential?.display?.backgroundImage;
    const backgroundColor = credential?.display?.backgroundColor || '#353E64';
    const fadeBackgroundImage = credential?.display?.fadeBackgroundImage || false;
    const repeatBackgroundImage = false;
    const emoji = credential?.display?.emoji;

    const familyName = credential?.name;
    const familyMotto = credential?.credentialSubject?.achievement?.description;

    let backgroundStyles = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#353E64',
    };

    if (fadeBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${backgroundImage})`,
        };

        if (backgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${backgroundColor}80, ${backgroundColor}80), url(${backgroundImage})`,
            };
        }
    }

    if (repeatBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!fadeBackgroundImage) {
        backgroundStyles.backgroundColor = backgroundColor;
    }

    if (showSkeleton) {
        return <FamilyCardSkeleton />;
    }

    return (
        <div
            role="button"
            onClick={e => {
                e.stopPropagation();
                presentFamilyPreview();
            }}
            className="w-full flex items-center justify-center flex-col max-w-[600px] mt-4 max-h-[190px]"
        >
            <div className="w-full flex items-center justify-center bg-white rounded-[20px] overflow-hidden shadow-soft-bottom">
                <div className="bg-white min-w-[160px] flex items-center justify-center relative">
                    <div
                        style={{ ...backgroundStyles }}
                        className="rounded-[0px_0px_100px_0px] w-full h-full absolute z-10 top-0 left-0"
                    />
                    <FamilyCrest
                        containerClassName="z-9999"
                        imageClassName="w-[90px]"
                        familyName={familyName}
                        thumbnail={thumbnail}
                        showMinified
                        showEmoji={emoji?.unified}
                        emoji={emoji}
                    />
                </div>
                <div className="w-full flex flex-col items-start justify-center h-full relative">
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            newModal(
                                <FamilyActionMenu
                                    credential={credential}
                                    boostUri={boostUri}
                                    handleShareBoostLink={presentShareBoostLink}
                                />
                            );
                        }}
                        className="absolute top-2 right-2"
                    >
                        <ThreeDots className="w-[20px] h-auto" />
                    </button>
                    <div className="flex items-center justify-start font-poppins font-semibold text-[17px] xs:text-sm pl-3 pt-3">
                        <VerifiedBadge className="mr-[6px] mb-[2px]" />
                        <p className="w-full line-clamp-1">{familyName}</p>
                    </div>
                    <p className="font-poppins text-xs font-semibold mt-2 pl-3">
                        {totalMembersCount} Members
                    </p>

                    <div className="pl-3">
                        <FamilyBoostMembersList showMinified credential={credential} />
                    </div>

                    {!hasParentSwitchedProfiles ? (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                presentInviteModal();
                            }}
                            className="bg-amber-400 text-sm xs:text-xs font-poppins font-semibold rounded-full w-[90%] flex items-center justify-center mt-2 px-2 py-2 text-white ml-1"
                        >
                            New Member{' '}
                            <AddUser
                                className="text-white ml-2 xs:h-auto xs:w-[20px]"
                                fill="white"
                            />
                        </button>
                    ) : (
                        <div className="bg-transparent w-[90%] mt-2 px-2 py-2 text-white ml-1 min-h-[40px] max-h-[40px]" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyCard;
