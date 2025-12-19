import React, { useState } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import BoostCMSAppearanceFormHeader from './BoostCMSAppearanceFormHeader';
import BoostCMSCategoryAndTypeSelector from './BoostCMSAchievementTypeSelector';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { BoostUserTypeEnum } from '../../../boost-options/boostOptions';
import { BoostCMSState } from '../../../boost';

export enum BoostCMSActiveAppearanceForm {
    appearanceForm = 'appearanceForm',
    achievementTypeForm = 'achievementTypeForm',
    badgeForm = 'badgeForm',
}

const BoostCMSAchievementTypeSelectorModal: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    showCloseButton: boolean;
    handleCloseModal: () => void;
    boostUserType: BoostUserTypeEnum;
    customTypes: any;
    setCustomTypes: React.Dispatch<any>;
    errors?: Record<string, string[]>;
    disabled?: boolean;
    handleCategoryAndTypeChange: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;
}> = ({
    state,
    setState,
    showCloseButton = false,
    handleCloseModal,
    boostUserType,
    customTypes,
    setCustomTypes,
    errors,
    disabled = false,
    handleCategoryAndTypeChange,
}) => {
    const [activeCategoryType, setActiveCategoryType] = useState<string>(state?.basicInfo?.type);
    const [activeType, setActiveType] = useState<string>(state?.basicInfo?.achievementType);

    const [activeForm, setActiveForm] = useState<BoostCMSActiveAppearanceForm>(
        BoostCMSActiveAppearanceForm.achievementTypeForm
    );

    const [showStylePackCategoryList, setShowStylePackCategoryList] = useState<boolean>(false);

    return (
        <IonPage>
            <BoostCMSAppearanceFormHeader
                state={state}
                setState={setState}
                activeCategoryType={activeCategoryType}
                setActiveCategoryType={setActiveCategoryType}
                activeType={activeType}
                setActiveType={setActiveType}
                showCloseButton={showCloseButton}
                handleCloseModal={handleCloseModal}
                boostUserType={boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                activeForm={activeForm}
                setActiveForm={handleCloseModal}
                showStylePackCategoryList={showStylePackCategoryList}
                setShowStylePackCategoryList={setShowStylePackCategoryList}
            />
            <IonContent fullscreen>
                <BoostCMSCategoryAndTypeSelector
                    activeCategoryType={activeCategoryType}
                    activeType={activeType}
                    setActiveType={setActiveType}
                    customTypes={customTypes}
                    setCustomTypes={setCustomTypes}
                />
            </IonContent>
        </IonPage>
    );
};

export default BoostCMSAchievementTypeSelectorModal;
