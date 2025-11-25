import React, { useState } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import BoostCMSAppearanceFormHeader from './BoostCMSAppearanceFormHeader';
import BoostCMSCategoryAndTypeSelector from './BoostCMSAchievementTypeSelector';

import { BoostCategoryOptionsEnum, useDeviceTypeByWidth, useModal } from 'learn-card-base';
import { BoostUserTypeEnum } from '../../../boost-options/boostOptions';
import { BoostCMSState } from '../../../boost';

export enum BoostCMSActiveAppearanceForm {
    appearanceForm = 'appearanceForm',
    achievementTypeForm = 'achievementTypeForm',
    badgeForm = 'badgeForm',
}

type AchievementTypeSelectorModalProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    showCloseButton: boolean;
    boostUserType: BoostUserTypeEnum;
    customTypes: any;
    setCustomTypes: React.Dispatch<any>;
    errors?: Record<string, string[]>;
    disabled?: boolean;
    handleCategoryAndTypeChange: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;
};

const BoostCMSAchievementTypeSelectorModal: React.FC<AchievementTypeSelectorModalProps> = ({
    state,
    setState,
    showCloseButton = false,
    boostUserType,
    customTypes,
    setCustomTypes,
    errors,
    disabled = false,
    handleCategoryAndTypeChange,
}) => {
    const { closeModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    const [activeCategoryType, setActiveCategoryType] = useState<string>(state?.basicInfo?.type);
    const [activeType, setActiveType] = useState<string>(state?.basicInfo?.achievementType);

    const [activeForm, setActiveForm] = useState<BoostCMSActiveAppearanceForm>(
        BoostCMSActiveAppearanceForm.achievementTypeForm
    );

    const [showStylePackCategoryList, setShowStylePackCategoryList] = useState<boolean>(false);

    return (
        <section className={`relative ${isDesktop ? 'h-[500px]' : 'h-full'} flex flex-col`}>
            <BoostCMSAppearanceFormHeader
                state={state}
                setState={setState}
                activeCategoryType={activeCategoryType}
                setActiveCategoryType={setActiveCategoryType}
                activeType={activeType}
                setActiveType={setActiveType}
                showCloseButton={showCloseButton}
                boostUserType={boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                activeForm={activeForm}
                setActiveForm={closeModal}
                showStylePackCategoryList={showStylePackCategoryList}
                setShowStylePackCategoryList={setShowStylePackCategoryList}
            />
            <div className="overflow-y-auto flex-1">
                <BoostCMSCategoryAndTypeSelector
                    activeCategoryType={activeCategoryType}
                    activeType={activeType}
                    setActiveType={setActiveType}
                    customTypes={customTypes}
                    setCustomTypes={setCustomTypes}
                />
            </div>
        </section>
    );
};

export default BoostCMSAchievementTypeSelectorModal;
