import React from 'react';

import { BoostCategoryOptionsEnum, isCustomBoostType, useModal } from 'learn-card-base';

import { IonRow, IonCol, IonToolbar } from '@ionic/react';

import X from 'learn-card-base/svgs/X';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostCMSCategoryTypeSwiper from './BoostCMSCategoryTypeSwiper';

import {
    AccommodationsCategoryTypes,
    AccomplishmentsCategoryTypes,
    AchievementCategoryTypes,
    IdCategoryTypes,
    LearnHistoryCategoryTypes,
    MembershipCategoryTypes,
    SkillCategroyTypes,
    SocialBadgesCategoryTypes,
    WorkHistoryCategoryTypes,
} from 'learn-card-base/components/IssueVC/constants';
import { BoostUserTypeEnum } from '../../../boost-options/boostOptions';
import { BoostCMSState } from '../../../boost';

import 'swiper/css/navigation';

export enum BoostCMSActiveAppearanceForm {
    appearanceForm = 'appearanceForm',
    achievementTypeForm = 'achievementTypeForm',
    badgeForm = 'badgeForm',
}

type BoostCMSAppearanceFormHeaderProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    showCloseButton: boolean;
    boostUserType: BoostUserTypeEnum;
    errors?: Record<string, string[]>;
    disabled?: boolean;
    handleCategoryAndTypeChange: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;

    activeCategoryType: string;
    setActiveCategoryType: React.Dispatch<React.SetStateAction<string>>;
    activeType: string;
    setActiveType: React.Dispatch<React.SetStateAction<string>>;
    activeForm: BoostCMSActiveAppearanceForm;
    setActiveForm: React.Dispatch<React.SetStateAction<BoostCMSActiveAppearanceForm>>;

    showStylePackCategoryList: boolean;
    setShowStylePackCategoryList: React.Dispatch<React.SetStateAction<boolean>>;

    handleSaveAppearance?: () => void;
};

const BoostCMSAppearanceFormHeader: React.FC<BoostCMSAppearanceFormHeaderProps> = ({
    state,
    setState,
    showCloseButton = false,
    boostUserType,
    errors,
    disabled = false,
    handleCategoryAndTypeChange,

    activeCategoryType,
    setActiveCategoryType,
    activeType,
    setActiveType,
    activeForm,
    setActiveForm,

    showStylePackCategoryList,
    setShowStylePackCategoryList,

    handleSaveAppearance = () => { },
}) => {
    const { closeModal } = useModal();
    let formTitle: string = '';

    const isCategoryAndTypeSaveDisabled = (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ): boolean => {
        // if type is custom, bypass enforcing custom type to a specific category
        if (isCustomBoostType(achievementType)) {
            return false;
        }

        if (
            categoryType === BoostCategoryOptionsEnum.achievement &&
            !AchievementCategoryTypes.includes(achievementType)
        )
            return true;
        if (
            categoryType === BoostCategoryOptionsEnum.id &&
            !IdCategoryTypes.includes(achievementType)
        )
            return true;
        if (
            categoryType === BoostCategoryOptionsEnum.skill &&
            !SkillCategroyTypes.includes(achievementType)
        )
            return true;
        if (
            categoryType === BoostCategoryOptionsEnum.learningHistory &&
            !LearnHistoryCategoryTypes.includes(achievementType)
        )
            return true;
        if (
            categoryType === BoostCategoryOptionsEnum.workHistory &&
            !WorkHistoryCategoryTypes.includes(achievementType)
        )
            return true;
        if (
            categoryType === BoostCategoryOptionsEnum.socialBadge &&
            !SocialBadgesCategoryTypes.includes(achievementType)
        )
            return true;

        if (
            categoryType === BoostCategoryOptionsEnum.membership &&
            !MembershipCategoryTypes.includes(achievementType)
        )
            return true;

        if (
            categoryType === BoostCategoryOptionsEnum.accommodation &&
            !AccommodationsCategoryTypes.includes(achievementType)
        )
            return true;

        if (
            categoryType === BoostCategoryOptionsEnum.accomplishment &&
            !AccomplishmentsCategoryTypes.includes(achievementType)
        )
            return true;

        return false;
    };

    const saveDisabled = isCategoryAndTypeSaveDisabled(activeCategoryType, activeType);
    let headerContainerStyles = '';
    let headerBackButtonStyles = '';
    let titleStyles = 'flex-1';

    if (activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm) {
        formTitle = 'Boost Type';
        headerContainerStyles = 'items-center justify-between px-2 mt-2';
        headerBackButtonStyles = 'w-[86px] h-[44px]';
    } else if (activeForm === BoostCMSActiveAppearanceForm.badgeForm) {
        if (showStylePackCategoryList) {
            formTitle = 'Select Style Pack';
            headerContainerStyles = 'items-center justify-center px-2';
        } else {
            formTitle = 'Select Image';
            headerContainerStyles = 'items-center justify-center px-2';
        }
    } else {
        formTitle = 'Appearance';
        titleStyles = 'flex-none';
        headerContainerStyles = 'items-center justify-between px-4 pb-2';
    }

    const handleGoBack = () => {
        if (showStylePackCategoryList) {
            setShowStylePackCategoryList(false);
        } else {
            setActiveForm(BoostCMSActiveAppearanceForm.appearanceForm);
            setActiveCategoryType(state?.basicInfo?.type);
            setActiveType(state?.basicInfo?.achievementType);
        }
    };

    return (
        <div className="ion-no-border bg-white pt-2">
            <IonRow className="w-full bg-white px-3">
                <IonCol className="w-full flex items-center justify-end">
                    {showCloseButton && (
                        <button onClick={closeModal}>
                            <X className="text-grayscale-600 h-8 w-8" />
                        </button>
                    )}
                </IonCol>
            </IonRow>
            <div className="bg-white">
                <div className="flex flex-col items-center justify-center w-full">
                    <div className={`w-full flex  ${headerContainerStyles}`}>
                        {(activeForm === BoostCMSActiveAppearanceForm.badgeForm ||
                            activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm) && (
                                <button
                                    className={`ion-no-padding p-0 text-grayscale-800 ${headerBackButtonStyles}`}
                                    onClick={handleGoBack}
                                >
                                    <CaretLeft className="h-auto w-3 text-black" />
                                </button>
                            )}
                        <p
                            className={`text-grayscale-800 font-poppins font-medium text-xl text-center relative ${titleStyles}`}
                        >
                            {formTitle}
                        </p>
                        {activeForm === BoostCMSActiveAppearanceForm.appearanceForm && (
                            <button
                                onClick={() => {
                                    handleSaveAppearance();
                                    closeModal();
                                }}
                                className={`rounded-full ion-no-padding p-0 shadow-3xl font-poppins text-xl  text-white w-[86px] h-[44px] bg-emerald-700`}
                                disabled={disabled}
                            >
                                Save
                            </button>
                        )}
                        {activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm && (
                            <button
                                onClick={() => {
                                    handleCategoryAndTypeChange(activeCategoryType, activeType);
                                    closeModal();
                                }}
                                className={`rounded-full ion-no-padding p-0 shadow-3xl font-poppins text-xl  text-grayscale-800 w-[86px] h-[44px] ${saveDisabled ? 'bg-grayscale-100' : 'bg-white'
                                    }`}
                                disabled={saveDisabled}
                            >
                                Save
                            </button>
                        )}
                    </div>
                    {activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm && (
                        <BoostCMSCategoryTypeSwiper
                            boostUserType={boostUserType || BoostUserTypeEnum.someone}
                            activeCategoryType={activeCategoryType}
                            setActiveCategoryType={setActiveCategoryType}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoostCMSAppearanceFormHeader;
