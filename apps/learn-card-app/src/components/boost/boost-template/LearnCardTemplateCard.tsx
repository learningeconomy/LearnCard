import React from 'react';
import { useHistory } from 'react-router-dom';

import {
    useModal,
    CredentialCategory,
    BoostUserTypeEnum,
    BoostCMSAppearanceDisplayTypeEnum,
} from 'learn-card-base';

import { IonCol } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import { BoostSmallCard } from '@learncard/react';

import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';

import { CredentialCategoryEnum } from 'learn-card-base';
import { boostCategoryOptions } from '../boost-options/boostOptions';
import { useLCAStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { getDefaultAchievementTypeImage, getDefaultDisplayType } from '../boostHelpers';
import { getAchievementTypeDisplayText } from 'learn-card-base/helpers/credentialHelpers';

type LearnCardTemplateCardProps = {
    categoryType: CredentialCategory;
    sizeLg?: number;
    sizeMd?: number;
    sizeSm?: number;
    userToBoostProfileId?: string;
    subType?: string;
};

export const LearnCardTemplateCard: React.FC<LearnCardTemplateCardProps> = ({
    categoryType,
    sizeLg = 4,
    sizeSm = 4,
    sizeMd = 4,
    userToBoostProfileId,
    subType,
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();

    const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${categoryType}&boostSubCategoryType=${subType}`;
    let link = baseLink;
    if (userToBoostProfileId) {
        link = `${baseLink}&otherUserProfileId=${userToBoostProfileId}`;
    }

    const { data: boostAppearanceBadgeList, isLoading: stylePackLoading } =
        useLCAStylesPackRegistry();

    const badgeThumbnail = getDefaultAchievementTypeImage(
        categoryType,
        subType,
        boostCategoryOptions[categoryType]?.CategoryImage,
        boostAppearanceBadgeList
    );

    const displayType: BoostCMSAppearanceDisplayTypeEnum = getDefaultDisplayType(categoryType);

    const categoryColors = {
        [CredentialCategoryEnum.learningHistory]: 'emerald-700',
        [CredentialCategoryEnum.socialBadge]: 'cyan-700',
        [CredentialCategoryEnum.achievement]: 'pink-400',
        [CredentialCategoryEnum.accomplishment]: 'yellow-400',
        [CredentialCategoryEnum.workHistory]: 'cyan-400',
        [CredentialCategoryEnum.accommodation]: 'violet-400',
        [CredentialCategoryEnum.id]: 'teal-500',
        [CredentialCategoryEnum.membership]: 'teal-400',
    };
    const textColor = categoryColors[categoryType];

    const bgColors = {
        [CredentialCategoryEnum.learningHistory]: 'bg-emerald-700',
        [CredentialCategoryEnum.socialBadge]: 'bg-blue-400',
        [CredentialCategoryEnum.achievement]: 'bg-pink-400',
        [CredentialCategoryEnum.accomplishment]: 'bg-yellow-400',
        [CredentialCategoryEnum.workHistory]: 'bg-cyan-400',
        [CredentialCategoryEnum.accommodation]: 'bg-violet-400',
        [CredentialCategoryEnum.id]: 'bg-blue-500',
        [CredentialCategoryEnum.membership]: 'bg-teal-400',
    };

    let customTitle = undefined;
    if (displayType === BoostCMSAppearanceDisplayTypeEnum.Certificate) {
        const achievementTypeDisplay = getAchievementTypeDisplayText(subType, categoryType);
        customTitle = (
            <div className="flex flex-col items-center pt-[5px] gap-[5px]">
                <span className="text-grayscale-900 text-[16px] font-notoSans font-semibold text-center leading-[125%] line-clamp-2 px-[8px]">
                    LearnCard Template
                </span>
                <span
                    className={`text-${textColor} text-center text-[12px] font-[600] uppercase font-notoSans`}
                >
                    {achievementTypeDisplay}
                </span>
            </div>
        );
    }

    const buttonBgColor = bgColors[categoryType];

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IonCol
                size="6"
                size-sm={sizeSm}
                size-md={sizeMd}
                size-lg={sizeLg}
                className="flex justify-center items-center relative"
            >
                <BoostSmallCard
                    className="bg-white text-black z-[1000] mt-[15px]"
                    customHeaderClass="boost-managed-card"
                    customTitle={customTitle}
                    customButtonComponent={
                        <div className="flex w-full flex-col items-center justify-center mb-[8px]">
                            <div
                                onClick={() => {
                                    closeAllModals();
                                    history.push(link);
                                }}
                                className={`cursor-pointer small-boost-boost-btn shadow-bottom boost-btn-click rounded-[40px] w-[140px] h-[32px] text-white flex gap-[5px] justify-center items-center ${buttonBgColor}`}
                            >
                                <span className=" text-[17px] font-[500]">Issue</span>
                                <GearPlusIcon className="h-[20px] w-[20px] text-grayscale-800" />
                            </div>
                        </div>
                    }
                    customThumbComponent={
                        <CredentialBadge
                            achievementType={subType}
                            boostType={categoryType}
                            displayType={displayType}
                            badgeThumbnail={badgeThumbnail}
                            showBackgroundImage
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            badgeCircleCustomClass="!w-[117px] h-[117px] mt-1"
                            badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                            badgeRibbonCustomClass="w-[26px]"
                            badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                        />
                    }
                    title="LearnCard Template"
                />
            </IonCol>
        </ErrorBoundary>
    );
};

export default LearnCardTemplateCard;
