import React, { useState } from 'react';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

import { BoostUserTypeEnum } from '../../../boost-options/boostOptions';

import BoostCMSAppearanceBadgeList from './BoostCMSAppearanceBadgeList';

import { BoostCMSState } from '../../../boost';

import BoostCMSAppearanceForm from './BoostCMSAppearanceForm';
import BoostCMSAppearanceFormHeader from './BoostCMSAppearanceFormHeader';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppGrid } from 'learn-card-base/ui/layout';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    customTypes: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
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

    // eslint-disable-next-line no-useless-assignment -- existing dead initial value; removing it touches control flow, out of scope here
    let activeFormEl = null;
    // eslint-disable-next-line no-useless-assignment -- existing dead initial value; removing it touches control flow, out of scope here
    let formBackgroundColor: string = '';

    if (activeForm === BoostCMSActiveAppearanceForm.badgeForm) {
        formBackgroundColor = '#FFFFFF'; // white

        activeFormEl = (
            <AppGrid
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
            </AppGrid>
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
        <AppPage>
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
            <AppContent fullscreen>{activeFormEl}</AppContent>
        </AppPage>
    );
};

export default BoostCMSAppearanceFormModal;
