import React, { useState } from 'react';

import { BoostCategoryOptionsEnum, useModal } from 'learn-card-base';

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

type BoostCMSAppearanceFormModalProps = {
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

const BoostCMSAppearanceFormModal: React.FC<BoostCMSAppearanceFormModalProps> = ({
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
    const { newModal, closeModal } = useModal();
    const [activeCategoryType, setActiveCategoryType] = useState<string>(state?.basicInfo?.type);
    const [activeType, setActiveType] = useState<string>(state?.basicInfo?.achievementType);

    const [activeForm, setActiveForm] = useState<BoostCMSActiveAppearanceForm>(
        BoostCMSActiveAppearanceForm.appearanceForm
    );

    // dupe boost cms state
    const [appearanceFormState, setAppearanceFormState] = useState<BoostCMSState>({
        ...state,
    });

    const [showStylePackCategoryList, setShowStylePackCategoryList] = useState<boolean>(false);

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
                    // handleCloseModal={handleCloseModal}
                    disabled={disabled}
                    boostUserType={boostUserType}
                    showStylePackCategoryList={showStylePackCategoryList}
                    setShowStylePackCategoryList={setShowStylePackCategoryList}
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
                handleSaveAppearance={handleSaveAppearance}
            />
        );
    }

    return (
        <>
            <BoostCMSAppearanceFormHeader
                state={appearanceFormState}
                setState={setAppearanceFormState}
                activeCategoryType={activeCategoryType}
                setActiveCategoryType={setActiveCategoryType}
                activeType={activeType}
                setActiveType={setActiveType}
                showCloseButton={showCloseButton}
                boostUserType={boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                activeForm={activeForm}
                setActiveForm={setActiveForm}
                showStylePackCategoryList={showStylePackCategoryList}
                setShowStylePackCategoryList={setShowStylePackCategoryList}
                handleSaveAppearance={handleSaveAppearance}
            />
            {activeFormEl}
        </>
    );
};

export default BoostCMSAppearanceFormModal;
