import React from 'react';

import { BoostCategoryOptionsEnum, isCustomBoostType } from 'learn-card-base';

import { IonRow, IonCol, IonHeader, IonToolbar } from '@ionic/react';

import X from 'learn-card-base/svgs/X';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostCMSCategoryTypeSwiper from './BoostCMSCategoryTypeSwiper';

import {
    AchievementCategoryTypes,
    IdCategoryTypes,
    LearnHistoryCategoryTypes,
    MembershipCategoryTypes,
    MeritBadgesCategoryTypes,
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
    handleCloseModal: () => void;
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
    handleCloseModal,
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

    handleSaveAppearance = () => {},
}) => {
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
            categoryType === BoostCategoryOptionsEnum.membership &&
            !MembershipCategoryTypes.includes(achievementType)
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
            categoryType === BoostCategoryOptionsEnum.meritBadge &&
            !MeritBadgesCategoryTypes.includes(achievementType)
        )
            return true;

        return false;
    };

    const saveDisabled = isCategoryAndTypeSaveDisabled(activeCategoryType, activeType);
    let headerContainerStyles = '';
    let headerBackButtonStyles = '';
    let titleStyles = 'flex-1';

    if (activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm) {
        formTitle = 'Type';
        headerContainerStyles = 'items-center justify-between';
        headerBackButtonStyles = 'w-[86px] h-[44px]';
    } else if (activeForm === BoostCMSActiveAppearanceForm.badgeForm) {
        if (showStylePackCategoryList) {
            formTitle = 'Select Style Pack';
            headerContainerStyles = 'items-center justify-center';
        } else {
            formTitle = 'Select Image';
            headerContainerStyles = 'items-center justify-center';
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
        <IonHeader className="ion-no-border bg-white w-full">
            <IonRow className="w-full bg-white">
                <IonCol className="w-full flex items-center justify-end">
                    {showCloseButton && (
                        <button onClick={handleCloseModal}>
                            <X className="text-grayscale-600 h-8 w-8" />
                        </button>
                    )}
                </IonCol>
            </IonRow>
            <IonToolbar className="bg-white">
                <div className="flex flex-col items-center justify-center w-full">
                    <div className={`w-full flex px-2 ${headerContainerStyles}`}>
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
                            className={`text-grayscale-800 text-2xl text-center relative font-notoSans ${titleStyles}`}
                        >
                            {formTitle}
                        </p>
                        {activeForm === BoostCMSActiveAppearanceForm.appearanceForm && (
                            <button
                                onClick={() => {
                                    handleSaveAppearance();
                                    handleCloseModal();
                                }}
                                className={`rounded-full font-medium ion-no-padding p-0 shadow-3xl text-xl px-4 py-2 font-notoSans bg-emerald-700 text-white`}
                                disabled={disabled}
                            >
                                Save
                            </button>
                        )}
                        {activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm && (
                            <button
                                onClick={() => {
                                    handleCategoryAndTypeChange(activeCategoryType, activeType);
                                    handleCloseModal();
                                }}
                                className={`rounded-full font-medium ion-no-padding p-0 shadow-3xl text-xl px-4 py-2 font-notoSans text-grayscale-800 mt-2 ${
                                    saveDisabled ? 'bg-grayscale-100' : 'bg-white'
                                }`}
                                disabled={saveDisabled}
                            >
                                Save
                            </button>
                        )}
                    </div>
                    {activeForm === BoostCMSActiveAppearanceForm.achievementTypeForm && (
                        <BoostCMSCategoryTypeSwiper
                            boostUserType={boostUserType}
                            activeCategoryType={activeCategoryType}
                            setActiveCategoryType={setActiveCategoryType}
                        />
                    )}
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default BoostCMSAppearanceFormHeader;
