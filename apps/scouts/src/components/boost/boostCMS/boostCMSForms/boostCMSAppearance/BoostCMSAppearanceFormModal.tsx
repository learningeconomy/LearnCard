import React, { useState } from 'react';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

import { IonPage, IonContent, IonGrid } from '@ionic/react';
import { BoostUserTypeEnum } from '../../../boost-options/boostOptions';

import BoostCMSAppearanceBadgeList from './BoostCMSAppearanceBadgeList';

import { BoostCMSState } from '../../../boost';

import BoostCMSAppearanceForm from './BoostCMSAppearanceForm';
import BoostCMSAppearanceFormHeader from './BoostCMSAppearanceFormHeader';

export enum BoostCMSActiveAppearanceForm {
    appearanceForm = 'appearanceForm',
    achievementTypeForm = 'achievementTypeForm',
    badgeForm = 'badgeForm',
}

const BoostCMSAppearanceFormModal: React.FC<{
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
        BoostCMSActiveAppearanceForm.appearanceForm
    );

    // dupe boost cms state
    const [appearanceFormState, setAppearanceFormState] = useState<BoostCMSState>({
        ...state,
    });

    const handleSaveAppearance = () => {
        setState({
            ...appearanceFormState,
        });
    };

    let activeFormEl = null;
    let formBackgroundColor: string = '';

    if (activeForm === BoostCMSActiveAppearanceForm.badgeForm) {
        formBackgroundColor = '#ffffff';

        activeFormEl = (
            <IonGrid
                className="w-full h-full ion-no-padding flex justify-center items-start"
                style={{
                    backgroundColor: formBackgroundColor,
                }}
            >
                <BoostCMSAppearanceBadgeList
                    state={appearanceFormState}
                    setState={setAppearanceFormState}
                    handleCloseModal={handleCloseModal}
                    disabled={disabled}
                    boostUserType={boostUserType}
                    setActiveForm={setActiveForm}
                />
            </IonGrid>
        );
    } else {
        activeFormEl = (
            <BoostCMSAppearanceForm
                state={appearanceFormState}
                setState={setAppearanceFormState}
                setActiveForm={setActiveForm}
                activeCategoryType={activeCategoryType}
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                handleSaveAppearance={handleSaveAppearance}
            />
        );
    }

    return (
        <IonPage>
            <BoostCMSAppearanceFormHeader
                state={appearanceFormState}
                setState={setAppearanceFormState}
                activeCategoryType={activeCategoryType}
                setActiveCategoryType={setActiveCategoryType}
                activeType={activeType}
                setActiveType={setActiveType}
                showCloseButton={showCloseButton}
                handleCloseModal={handleCloseModal}
                boostUserType={boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                activeForm={activeForm}
                setActiveForm={setActiveForm}
                handleSaveAppearance={handleSaveAppearance}
            />
            <IonContent fullscreen>{activeFormEl}</IonContent>
        </IonPage>
    );
};

export default BoostCMSAppearanceFormModal;
