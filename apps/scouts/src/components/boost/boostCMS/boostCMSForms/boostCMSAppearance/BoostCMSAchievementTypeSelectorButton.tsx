import React, { useState } from 'react';

import { IonRow, useIonModal } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import {
    BoostCategoryOptionsEnum,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    getAchievementTypeFromCustomType,
    BoostUserTypeEnum,
} from 'learn-card-base';

import {
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../../boost-options/boostOptions';

import { BoostCMSState } from '../../../boost';
import BoostCMSAchievementTypeSelectorModal from './BoostCMSAchievementTypeSelectorModal';

type BoostCMSTypeSelectorButtonProps = {
    state: BoostCMSState;
    setState?: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    boostUserType?: BoostUserTypeEnum;
    customTypes: any;
    setCustomTypes: React.Dispatch<any>;
    disabled?: boolean;
    handleCategoryAndTypeChange?: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;
};

const BoostCMSAchievementTypeSelectorButton: React.FC<BoostCMSTypeSelectorButtonProps> = ({
    state,
    setState,
    boostUserType,
    customTypes,
    setCustomTypes,
    disabled = false,
    handleCategoryAndTypeChange,
}) => {
    let achievementTypeSelected;

    if (isCustomBoostType(state?.basicInfo?.achievementType)) {
        achievementTypeSelected = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(state?.basicInfo?.achievementType)
        );
    } else {
        achievementTypeSelected =
            CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type].find(
                options => options?.type === state?.basicInfo?.achievementType
            )?.title ?? '';
    }

    const { color: _color, IconComponent: Icon } = boostCategoryOptions[state?.basicInfo?.type];

    const [presentCenterModal, dismissCenterModal] = useIonModal(
        BoostCMSAchievementTypeSelectorModal,
        {
            state: state,
            setState: setState,
            showCloseButton: true,
            handleCloseModal: () => dismissCenterModal(),
            boostUserType: boostUserType,
            handleCategoryAndTypeChange: handleCategoryAndTypeChange,
            customTypes: customTypes,
            setCustomTypes: setCustomTypes,
        }
    );

    const [presentSheetModal, dismissSheetModal] = useIonModal(
        BoostCMSAchievementTypeSelectorModal,
        {
            state: state,
            setState: setState,
            showCloseButton: false,
            handleCloseModal: () => dismissSheetModal(),
            boostUserType: boostUserType,
            handleCategoryAndTypeChange: handleCategoryAndTypeChange,
            customTypes: customTypes,
            setCustomTypes: setCustomTypes,
        }
    );

    return (
        <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4">
            <button
                className="w-full bg-white ion-padding rounded-[20px] flex items-center justify-between"
                disabled={disabled}
                onClick={() => {
                    const isMobile = window.innerWidth < 992;
                    if (isMobile) {
                        presentSheetModal();
                    } else {
                        presentCenterModal({
                            cssClass: 'center-modal user-options-modal',
                            backdropDismiss: false,
                            showBackdrop: false,
                        });
                    }
                }}
            >
                <div className="flex items-center justify-start text-xl font-notoSans text-grayscale-900">
                    <Icon className={`w-[30px] h-[30px] text-${_color} mr-1`} />{' '}
                    {achievementTypeSelected}
                </div>
                <CaretLeft className="rotate-180 text-grayscale-900" />
            </button>
        </IonRow>
    );
};

export default BoostCMSAchievementTypeSelectorButton;
