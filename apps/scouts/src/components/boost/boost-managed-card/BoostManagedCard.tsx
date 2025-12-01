'use client';
import React, { useEffect, useState } from 'react';
import { VC, Boost } from '@learncard/types';
import { IonCol } from '@ionic/react';
import { BoostSmallCard } from '@learncard/react';
import BoostPreviewBody from '../../boost/boostCMS/BoostPreview/BoostPreviewBody';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import { ErrorBoundary } from 'react-error-boundary';
import Plus from '../../svgs/Plus';
import {
    BrandingEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    CredentialCategoryEnum,
    getBoostMetadata,
    BoostCategoryOptionsEnum,
    categoryMetadata,
    useGetBoostParents,
    useGetBoostPermissions,
} from 'learn-card-base';

import { closeAll } from '../../../helpers/uiHelpers';

import Lottie from 'react-lottie-player';
import HourGlass from '../../../assets/lotties/hourglass.json';
import BoostListItem from 'learn-card-base/components/boost/BoostListItem';
import BadgeSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton';
import BoostTextSkeleton, {
    BoostSkeleton,
} from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';
import useManagedBoost from '../../../hooks/useManagedBoost';

type BoostManagedCardProps = {
    boost: Boost;
    boostVC?: VC;
    defaultImg: string;
    categoryType: string;
    sizeLg?: number;
    sizeMd?: number;
    sizeSm?: number;
    branding?: BrandingEnum;
    userToBoostProfileId?: string;
    boostPageViewMode?: BoostPageViewModeType;
    showSelectMenuPlusButton?: boolean;
    handleCloseModal?: () => void;
    useCmsModal?: boolean;
    loading?: boolean;
    parentUri?: string;
    refetchQuery?: () => void;
    overrideCustomize?: boolean;
};

export const BoostManagedCard: React.FC<BoostManagedCardProps> = ({
    boost,
    boostVC: _boostVC,
    defaultImg,
    categoryType,
    sizeLg = 4,
    sizeSm = 4,
    sizeMd = 4,
    branding,
    userToBoostProfileId,
    boostPageViewMode = BoostPageViewMode.Card,
    showSelectMenuPlusButton = false,
    useCmsModal = false,
    handleCloseModal = () => { },
    loading,
    parentUri,
    refetchQuery,
    overrideCustomize,
}) => {
    const {
        cred,
        boostVC,
        isLive,
        isDraft,
        recipients,
        thumbImage,
        issueHistory,
        showSkeleton,
        recipientCount,
        badgeThumbnail,
        recipientsLoading,
        handleEditOnClick,
        handleIssueOnClick,
        handleOptionsMenu,
        presentManagedBoostModal,
        handlePresentShortBoostModal,
    } = useManagedBoost(boost, {
        boostVC: _boostVC,
        categoryType,
        loading,
        defaultImg,
        parentUri,
        useCmsModal,
        branding,
        refetchQuery,
        overrideCustomize,
    });

    const { data: parentBoosts } = useGetBoostParents(boost?.uri, 1);

    const { data: boostPermissionData } = useGetBoostPermissions(boost?.uri);

    const parentBoost = parentBoosts?.records?.[0]; // just default to the first one, guess we're just assuming there's only one
    const parentSourceTitle = parentBoost?.name;

    const [bodyComponent, setBodyComponent] = useState<React.ReactNode>();

    const handleShowShortBoostModal = () => {
        closeAll();
        handlePresentShortBoostModal();
    };

    const cardTitle = boost?.name || boostVC?.credentialSubject?.achievement?.name;
    const { color, credentialType = CredentialCategoryEnum.achievement } =
        getBoostMetadata(categoryType as BoostCategoryOptionsEnum | CredentialCategoryEnum) || {};

    const type = categoryMetadata[credentialType].walletSubtype;

    const isMeritBadge = categoryType === CredentialCategoryEnum.meritBadge;

    useEffect(() => {
        let customBody;

        if (showSelectMenuPlusButton) {
            customBody = <></>;
        }

        if (recipientsLoading) {
            customBody = (
                <div className="relative w-full text-center flex flex-col items-center justify-center">
                    <div className="max-w-[50px]">
                        <Lottie
                            loop
                            animationData={HourGlass}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            );
        }

        if ((recipients?.length ?? 0) > 0 || typeof recipientCount === 'number') {
            customBody = (
                <BoostPreviewBody
                    recipients={recipients ?? []}
                    recipientCountOverride={recipientCount}
                    showRecipientText={false}
                    customRecipientContainerClass="px-[10px] py-0"
                    customBoostPreviewContainerClass="bg-none"
                    customBoostPreviewContainerRowClass="items-center"
                    hideBodyPreviewOnCard={isDraft}
                />
            );
        }

        setBodyComponent(customBody);
    }, [recipientsLoading]);

    const isCardView = boostPageViewMode === BoostPageViewMode.Card;

    const buttonBgColor = isMeritBadge ? 'bg-sp-purple-base' : 'bg-sp-blue-dark-ocean';

    let customTitle = undefined;
    const userCanEdit = boostPermissionData?.canEdit || boostPermissionData?.canEditChildren;
    if (showSkeleton) {
        customTitle = (
            <div className="w-full flex flex-col items-center justify-center pt-2">
                <BoostTextSkeleton
                    containerClassName="w-full flex items-center justify-center"
                    skeletonStyles={{ width: '80%' }}
                />
                <BoostTextSkeleton
                    containerClassName="w-full flex items-center justify-center"
                    skeletonStyles={{ width: '60%' }}
                />
            </div>
        );
    } else if (categoryType === CredentialCategoryEnum.meritBadge) {
        customTitle = (
            <div className="flex flex-col w-full items-center">
                <span className="w-full text-grayscale-900 text-[16px] font-notoSans font-semibold text-center leading-[125%] line-clamp-2 px-[8px]">
                    {cardTitle}
                </span>
                <span className="text-sp-purple-base text-[12px] font-[600] uppercase font-notoSans">
                    Merit Badge
                </span>
                <span className="px-[10px] text-[11px] line-clamp-1">{parentSourceTitle}</span>
            </div>
        );
    } else {
        customTitle = (
            <div className="flex flex-col w-full items-center">
                <span className="text-grayscale-900 mb-[5px] text-[16px] font-notoSans font-semibold text-center leading-[100%] line-clamp-2 px-[8px]">
                    {cardTitle}
                </span>

                <span className="px-[10px] text-[11px] line-clamp-1">{parentSourceTitle}</span>
            </div>
        );
    }

    let customButton = undefined;
    if (showSkeleton) {
        customButton = (
            <BoostSkeleton
                containerClassName="small-boost-boost-btn-2 flex boost-btn-click rounded-[40px] w-[140px] h-[48px] text-white flex justify-center items-center"
                skeletonStyles={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '100px',
                }}
            />
        );
    } else if (isDraft && userCanEdit) {
        customButton = (
            <div className="flex w-full flex-col items-center justify-center">
                {isDraft && (
                    <button
                        className="flex rounded-[40px] w-[140px] h-[32px] justify-center items-center text-grayscale-900 bg-grayscale-200 shadow-bottom text-base font-medium"
                        onClick={e => {
                            e.stopPropagation();
                            handleEditOnClick();
                        }}
                    >
                        Edit Draft
                    </button>
                )}
            </div>
        );
    } else if (isLive && boostPermissionData?.canIssue) {
        customButton = (
            <div className="flex w-full flex-col items-center justify-center">
                <div
                    onClick={boostVC ? () => handleShowShortBoostModal(boost) : undefined}
                    className={`cursor-pointer small-boost-boost-btn-2 shadow-bottom boost-btn-click rounded-[40px] w-[140px] h-[32px] text-white flex gap-[5px] justify-center items-center ${buttonBgColor}`}
                >
                    {!isMeritBadge && (
                        <>
                            <span className="font-notoSans text-[17px] font-[700]">Boost</span>
                            <BoostOutline2
                                size="25"
                                outsideStar="#FFFFFF"
                                insideStar="#03748D"
                                outlineStar="#FFFFFF"
                                inlineStar="#03748D"
                            />
                        </>
                    )}
                    {isMeritBadge && (
                        <>
                            <span className="font-notoSans text-[17px] font-[700]">Award</span>
                            <PurpleMeritBadgesIcon className="w-[25px] h-[25px]" />
                        </>
                    )}
                </div>
            </div>
        );
    }
    // overrides the custom button if being viewed from the select menu
    if (showSelectMenuPlusButton && !showSkeleton) {
        customButton = (
            <div className="w-full flex flex-col items-center justify-center">
                <button
                    onClick={() => {
                        handleCloseModal();
                        handleIssueOnClick();
                    }}
                    className={`bg-${color} rounded-full p-[8px] w-fit h-fit shadow-soft-bottom `}
                >
                    <Plus className={`h-[20px] w-[20px] text-white`} />
                </button>
                {
                    <p
                        className={`text-xs font-notoSans text-grayscale-600 font-semibold   ${(recipientCount ?? 0) > 0
                                ? 'text-grayscale-600 mt-[6px]'
                                : 'text-white mt-[6px]'
                            }`}
                    >
                        Issued to {recipientCount ?? 0}{' '}
                        {(recipientCount ?? 0) === 1 ? 'person' : 'people'}
                    </p>
                }
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            {isCardView && (
                <IonCol
                    size="6"
                    size-sm={sizeSm}
                    size-md={sizeMd}
                    size-lg={sizeLg}
                    className="flex justify-center items-center relative"
                >
                    <BoostSmallCard
                        innerOnClick={
                            boostVC && !showSkeleton ? () => presentManagedBoostModal() : undefined
                        }
                        className={`bg-white text-black z-[1000] mt-[15px] ${isMeritBadge ? '!h-[298px]' : ''
                            }`}
                        customHeaderClass="boost-managed-card"
                        buttonOnClick={
                            boostVC && !showSkeleton
                                ? () => handleShowShortBoostModal(boost)
                                : undefined
                        }
                        thumbImgSrc={thumbImage}
                        optionsTriggerOnClick={
                            isDraft && !showSkeleton ? handleOptionsMenu : undefined
                        }
                        customButtonComponent={customButton}
                        customBodyComponent={
                            showSkeleton ? (
                                <div className="w-full flex items-center justify-center">
                                    <BoostSkeleton
                                        containerClassName="w-[40px] h-[40px] rounded-full"
                                        skeletonStyles={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '100px',
                                        }}
                                    />
                                </div>
                            ) : showSelectMenuPlusButton ? undefined : (
                                bodyComponent
                            )
                        }
                        customThumbComponent={
                            showSkeleton ? (
                                <BadgeSkeleton
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                                />
                            ) : (
                                <CredentialBadge
                                    achievementType={
                                        boostVC?.credentialSubject?.achievement?.achievementType
                                    }
                                    boostType={categoryType}
                                    badgeThumbnail={badgeThumbnail}
                                    showBackgroundImage
                                    backgroundImage={boostVC?.display?.backgroundImage}
                                    backgroundColor={cred?.display?.backgroundColor}
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass={`w-[117px] h-[117px] mt-1 ${isMeritBadge ? 'mt-[20px]' : 'shadow-3xl'
                                        }`}
                                    badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                    badgeRibbonCustomClass="w-[26px]"
                                    badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                    displayType={cred?.display?.displayType}
                                    credential={boostVC}
                                    branding={branding}
                                />
                            )
                        }
                        title={cardTitle}
                        customTitle={customTitle}
                        issueHistory={showSelectMenuPlusButton ? undefined : issueHistory}
                        type={type}
                    />
                </IonCol>
            )}

            {!isCardView && (
                <BoostListItem
                    title={cardTitle}
                    onClick={presentManagedBoostModal}
                    onOptionsClick={handleOptionsMenu}
                    credential={cred}
                    categoryType={categoryType}
                    branding={branding}
                    loading={showSkeleton}
                />
            )}
        </ErrorBoundary>
    );
};

export default BoostManagedCard;
