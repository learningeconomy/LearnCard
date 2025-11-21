import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BoostSmallCard } from '@learncard/react';

import { IonCol } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';

import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
} from '../boost-options/boostOptions';
import { BoostCMSAppearanceDisplayTypeEnum, BrandingEnum, CredentialBadge } from 'learn-card-base';
import { getDefaultAchievementTypeImage } from '../boostHelpers';
import { ModalTypes, useModal } from 'learn-card-base';
import BoostCMS from '../boostCMS/BoostCMS';

export type NewBoostSelectMenuBoostPackItemProps = {
    stylePack: {
        category: BoostCategoryOptionsEnum;
        type: string;
        url: string;
    }[];
    handleCloseModal: () => void;
    category: BoostCategoryOptionsEnum;
    boostPackItem: {
        title: string;
        presetTitle?: string;
        description?: string;
        criteria?: string;
        image?: string;
        type: any;
    };
    parentUri?: string;
    useCMSModal?: boolean;
};

const NewBoostSelectMenuBoostPackItem: React.FC<NewBoostSelectMenuBoostPackItemProps> = ({
    handleCloseModal,
    stylePack,
    category = BoostCategoryOptionsEnum.socialBadge,
    boostPackItem,
    parentUri,
    useCMSModal = false,
}) => {
    const history = useHistory();
    const { newModal, closeModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const { CategoryImage, color } = boostCategoryOptions?.[category];

    const image = getDefaultAchievementTypeImage(
        category,
        boostPackItem.type,
        CategoryImage,
        stylePack
    );

    const handleBoostCMSRedirect = (achievementType: string) => {
        handleCloseModal();
        if (!useCMSModal) {
            const redirect = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${category}&boostSubCategoryType=${achievementType}`;
            history.push(redirect);
        } else {
            newModal(
                <BoostCMS
                    handleCloseModal={closeModal}
                    parentUri={parentUri}
                    category={category}
                    boostUserType={BoostUserTypeEnum.someone}
                    achievementType={achievementType}
                />
            );
        }
    };

    let buttonOverride = null;
    if (category === BoostCategoryOptionsEnum.socialBadge) {
        buttonOverride = (
            <div className="w-full flex items-center justify-center">
                <button
                    onClick={() => handleBoostCMSRedirect(boostPackItem.type)}
                    className={`bg-${color} rounded-full p-[8px] w-fit h-fit shadow-soft-bottom `}
                >
                    <Plus className={`h-[20px] w-[20px] text-white`} />
                </button>
            </div>
        );
    } else if (category === BoostCategoryOptionsEnum.meritBadge) {
        buttonOverride = (
            <div className="w-full flex flex-col items-center justify-center">
                <h4 className="font-semibold text-[17px] font-notoSans text-center px-4 line-clamp-2 mb-[2px]">
                    {boostPackItem.title}
                </h4>
                <button
                    onClick={() => handleBoostCMSRedirect(boostPackItem.type)}
                    className={`bg-${color} rounded-full  p-[8px] w-fit h-fit shadow-soft-bottom `}
                >
                    <Plus className={`h-[20px] w-[20px] text-white`} />
                </button>
            </div>
        );
    }

    return (
        <IonCol
            size="6"
            size-sm={4}
            size-md={4}
            size-lg={4}
            className="flex justify-center items-center relative pt-[20px]"
        >
            <BoostSmallCard
                className="!h-[220px]"
                innerOnClick={() => handleBoostCMSRedirect(boostPackItem.type)}
                customHeaderClass="boost-managed-card"
                buttonOnClick={() => handleBoostCMSRedirect(boostPackItem.type)}
                thumbImgSrc={''}
                customButtonComponent={buttonOverride}
                customBodyComponent={undefined}
                customThumbComponent={
                    <CredentialBadge
                        achievementType={boostPackItem.type}
                        boostType={category}
                        badgeThumbnail={image}
                        showBackgroundImage
                        backgroundImage={''}
                        backgroundColor={''}
                        badgeContainerCustomClass="mt-[0px] mb-[8px]"
                        badgeCircleCustomClass={`w-[117px] h-[117px] mt-1`}
                        badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                        badgeRibbonCustomClass="w-[26px]"
                        badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                        displayType={BoostCMSAppearanceDisplayTypeEnum.Badge}
                        credential={undefined}
                        branding={BrandingEnum.scoutPass}
                    />
                }
                title={''}
                issueHistory={undefined}
                type={category}
            />
        </IonCol>
    );
};

export default NewBoostSelectMenuBoostPackItem;
