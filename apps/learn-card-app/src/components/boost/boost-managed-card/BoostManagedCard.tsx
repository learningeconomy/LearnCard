'use client';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import useBoost from '../hooks/useBoost';
import useManagedBoost from 'apps/learn-card-app/src/hooks/useManagedBoost';

import { IonCol } from '@ionic/react';
import Lottie from 'react-lottie-player';
import { BoostSmallCard } from '@learncard/react';
import { ErrorBoundary } from 'react-error-boundary';
const HourGlass = '/lotties/hourglass.json';
import FamilyCard from '../../familyCMS/FamilyCard/FamilyCard';
import { BoostIssuanceLoading } from '../boostLoader/BoostLoader';
import CustomManagedBoostButton from './helpers/CustomManagedBoostButton';
import BoostListItem from 'learn-card-base/components/boost/BoostListItem';
import BoostPreviewBody from '../../boost/boostCMS/BoostPreview/BoostPreviewBody';
import CustomBoostTitleDisplay from '../boost-earned-card/helpers/CustomBoostTitleDisplay';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';
import BadgeSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton';

import {
    useModal,
    ModalTypes,
    BoostPageViewMode,
    CredentialCategory,
    BoostPageViewModeType,
    CredentialCategoryEnum,
    resetIonicModalBackground,
    categoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { VC, Boost } from '@learncard/types';
import { closeAll } from 'apps/learn-card-app/src/helpers/uiHelpers';
import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

type BoostManagedCardProps = {
    boost: Boost;
    boostVC?: VC;
    defaultImg: string;
    categoryType: CredentialCategory;
    sizeLg?: number;
    sizeMd?: number;
    sizeSm?: number;
    boostPageViewMode?: BoostPageViewModeType;
    userToBoostProfileId?: string;
    loading?: boolean;
};

export const BoostManagedCard: React.FC<BoostManagedCardProps> = ({
    boost,
    boostVC: _boostVC,
    defaultImg,
    categoryType,
    sizeLg = 4,
    sizeSm = 4,
    sizeMd = 4,
    boostPageViewMode = BoostPageViewMode.Card,
    userToBoostProfileId,
    loading,
}) => {
    const history = useHistory();
    const { newModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const {
        cred,
        boostVC,
        isDraft,
        isLive,
        recipients,
        thumbImage,
        issueHistory,
        showSkeleton,
        recipientCount,
        badgeThumbnail,
        recipientsLoading,
        formattedDisplayType,
        handleEditOnClick,
        handleOptionsMenu,
        presentManagedBoostModal,
        handlePresentShortBoostModal,
    } = useManagedBoost(boost, { boostVC: _boostVC, categoryType, loading, defaultImg });

    const [issueLoading, setIssueLoading] = useState(false);
    const { handleSubmitExistingBoostOther } = useBoost(history);

    const handleShowShortBoostModal = () => {
        closeAll();
        handlePresentShortBoostModal();
    };

    const handleCardBoostClick = async () => {
        if (userToBoostProfileId) {
            // immediately issue the boost to the chosen user
            setIssueLoading(true);
            newModal(<BoostIssuanceLoading loading={issueLoading} />);
            await handleSubmitExistingBoostOther(
                [{ profileId: userToBoostProfileId }],
                boost?.uri,
                boost?.status
            );
            setIssueLoading(false);
            closeAll?.();
            closeAllModals();
        } else {
            // show "Who do you want to Boost?" modal
            handleShowShortBoostModal();
        }
    };

    const innerOnClick = () => {
        if (showSkeleton) return;
        resetIonicModalBackground();
        presentManagedBoostModal();
    };

    const cardTitle = boost?.name || boostVC?.credentialSubject?.achievement?.name;

    const type = categoryMetadata[categoryType].walletSubtype;
    const { darkColor } = categoryMetadata[categoryType];

    const isAwardDisplay = boostVC?.display?.displayType === 'award';

    let draftButton;
    const bgColors = {
        [CredentialCategoryEnum.socialBadge]: '#3B82F6', // blue-500 - color
        [CredentialCategoryEnum.achievement]: '#EC4899', // pink-500 - color
        [CredentialCategoryEnum.learningHistory]: '#40CBA6', // emerald-500 - subColor
        [CredentialCategoryEnum.accomplishment]: '#EAB308', // yellow-500 - none (color = yellow-400)
        [CredentialCategoryEnum.accommodation]: '#8B5CF6', // violet-500 - subColor
        [CredentialCategoryEnum.workHistory]: '#71DAF5', // cyan-500 - color
        [CredentialCategoryEnum.id]: '#3B82F6', // blue-500 - none (color = blue-400)
    };

    const buttonBgColor = bgColors[categoryType as keyof typeof bgColors];

    if (isDraft) {
        draftButton = (
            <CustomManagedBoostButton
                showSkeleton={showSkeleton}
                isDraft
                isLive={false}
                buttonBgColor={buttonBgColor}
                handleEditOnClick={handleEditOnClick}
                handleShowShortBoostModal={handleShowShortBoostModal}
                boostVC={boostVC}
            />
        );
    }

    let customButtonComponent = (
        <CustomManagedBoostButton
            showSkeleton={showSkeleton}
            isDraft={isDraft}
            isLive={isLive}
            buttonBgColor={buttonBgColor}
            handleEditOnClick={handleEditOnClick}
            handleShowShortBoostModal={handleShowShortBoostModal}
            boostVC={boostVC}
        />
    );

    let customBody;
    if (recipientsLoading) {
        customBody = (
            <div className="relative w-full text-center flex flex-col items-center justify-center">
                <div className="max-w-[50px]">
                    <Lottie
                        loop
                        path={HourGlass}
                        play
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>
        );
    }

    if ((recipients?.length ?? 0) > 0 || recipientCount) {
        customBody = (
            <BoostPreviewBody
                recipients={recipients ?? []}
                recipientCountOverride={recipientCount}
                showRecipientText={false}
                customRecipientContainerClass="px-[10px] py-0"
                customBoostPreviewContainerClass="bg-none"
                customBoostPreviewContainerRowClass="items-center"
                credential={cred}
            />
        );
    }

    const isCardView = boostPageViewMode === BoostPageViewMode.Card;

    if (categoryType === BoostCategoryOptionsEnum.family) {
        return <FamilyCard showSkeleton={showSkeleton} credential={cred} />;
    }

    let customTitle;
    if (showSkeleton) {
        customTitle = <CustomBoostTitleDisplay showSkeleton />;
    } else {
        customTitle = (
            <CustomBoostTitleDisplay
                displayType={cred?.display?.displayType}
                title={cardTitle}
                formattedDisplayType={formattedDisplayType}
                textColor={darkColor}
                credential={cred}
                mediaTitleContainerClassName="!mt-[14px]"
            />
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
                        customDraftComponent={draftButton}
                        innerOnClick={
                            boostVC && !showSkeleton
                                ? () => {
                                      resetIonicModalBackground();
                                      innerOnClick();
                                  }
                                : undefined
                        }
                        className="bg-white text-black z-[1000] mt-[15px] h-[300px]"
                        customHeaderClass="boost-managed-card"
                        buttonOnClick={boostVC && !showSkeleton ? handleCardBoostClick : undefined}
                        thumbImgSrc={thumbImage}
                        optionsTriggerOnClick={
                            boost?.status === 'DRAFT' && !showSkeleton
                                ? handleOptionsMenu
                                : undefined
                        }
                        customButtonComponent={customButtonComponent}
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
                            ) : (
                                customBody
                            )
                        }
                        customThumbComponent={
                            showSkeleton ? (
                                <BadgeSkeleton
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                                />
                            ) : (
                                <CredentialBadgeNew
                                    achievementType={
                                        boostVC?.credentialSubject?.achievement?.achievementType
                                    }
                                    boostType={categoryType}
                                    badgeThumbnail={badgeThumbnail}
                                    showBackgroundImage
                                    backgroundImage={boostVC?.display?.backgroundImage}
                                    backgroundColor={cred?.display?.backgroundColor}
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass={`!w-[117px] h-[117px] mt-1 ${
                                        isAwardDisplay ? 'mt-[17px] mb-[-10px]' : 'shadow-3xl'
                                    }`}
                                    badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                    badgeRibbonCustomClass="w-[26px]"
                                    badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                    displayType={cred?.display?.displayType}
                                    credential={boostVC}
                                />
                            )
                        }
                        title={cardTitle}
                        customTitle={customTitle}
                        issueHistory={issueHistory}
                        type={type}
                    />
                </IonCol>
            )}
            {!isCardView && (
                <BoostListItem
                    title={cardTitle}
                    onClick={innerOnClick}
                    onOptionsClick={handleOptionsMenu}
                    credential={cred}
                    categoryType={categoryType}
                    loading={showSkeleton}
                    displayType={cred?.display?.displayType}
                    managedBoost={true}
                />
            )}
        </ErrorBoundary>
    );
};

export default BoostManagedCard;
