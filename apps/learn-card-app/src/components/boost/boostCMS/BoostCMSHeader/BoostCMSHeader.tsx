import React, { useEffect } from 'react';

import { IonHeader, IonToolbar, IonRow, IonCol } from '@ionic/react';

import { BoostUserTypeEnum } from '../../boost-options/boostOptions';
import { BoostCMSStepsEnum } from '../../boost';
import { BoostCategoryOptionsEnum, boostCategoryMetadata } from 'learn-card-base';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';

import useTheme from '../../../../theme/hooks/useTheme';

type BoostCMSHeaderProps = {
    boostUserType: BoostUserTypeEnum | string | null;
    selectedVCType: BoostCategoryOptionsEnum;
    currentStep: BoostCMSStepsEnum;
    handleNextStep: () => void;
    handlePrevStep: () => void;
    handleConfirmationModal: () => void;
    publishedBoostUri: string | null;
    handleSaveAndIssue: (boostUri?: string) => void;
    isLoading: boolean;
    issueToLength: number;
};

const BoostCMSHeader: React.FC<BoostCMSHeaderProps> = ({
    selectedVCType,
    boostUserType,
    currentStep,
    handleNextStep,
    handlePrevStep,
    handleConfirmationModal,
    publishedBoostUri,
    handleSaveAndIssue,
    isLoading,
    issueToLength,
}) => {
    const { getThemedCategoryIcons } = useTheme();
    const { Icon } = getThemedCategoryIcons(boostCategoryMetadata[selectedVCType].credentialType);
    const { title } = boostCategoryMetadata[selectedVCType];
    let headerTitle: React.ReactNode | string = '';

    if (currentStep === BoostCMSStepsEnum.create) {
        headerTitle = (
            <span className="flex items-center justify-start font-poppins font-bold sm:font-medium text-base sm:text-lg">
                <Icon className="w-[30px] h-[30px] mr-2" /> {title}
            </span>
        );
    } else if (currentStep === BoostCMSStepsEnum.publish) {
        headerTitle = 'Publish';
    } else if (currentStep === BoostCMSStepsEnum.issueTo) {
        headerTitle = 'Issue';
    } else if (currentStep === BoostCMSStepsEnum.confirmation) {
        headerTitle = 'Confirmation';
    }

    const handleGoBack = () => {
        if (
            currentStep === BoostCMSStepsEnum.create &&
            (boostUserType === BoostUserTypeEnum.self ||
                boostUserType === BoostUserTypeEnum.someone)
        ) {
            handleConfirmationModal();
        } else if (
            currentStep === BoostCMSStepsEnum.publish &&
            (boostUserType === BoostUserTypeEnum.self ||
                boostUserType === BoostUserTypeEnum.someone)
        ) {
            handlePrevStep();
        } else if (
            currentStep === BoostCMSStepsEnum.issueTo &&
            (boostUserType === BoostUserTypeEnum.self ||
                boostUserType === BoostUserTypeEnum.someone)
        ) {
            handlePrevStep();
        } else if (
            currentStep === BoostCMSStepsEnum.confirmation &&
            (boostUserType === BoostUserTypeEnum.self ||
                boostUserType === BoostUserTypeEnum.someone)
        ) {
            handleConfirmationModal();
        }
    };

    const handleQuitConfirmationModal = () => {
        handleConfirmationModal();
    };

    return (
        <IonHeader className="shadow-none">
            <IonToolbar color="grayscale-800" className="ion-no-border px-2">
                <IonRow className="flex items-center justify-center w-full py-[10px]">
                    <div className="w-full max-w-[600px] flex items-center justify-between">
                        <IonCol className="w-full flex justify-start items-center">
                            {currentStep === BoostCMSStepsEnum.publish && (
                                <button
                                    className="text-white p-0 mr-[1px] z-50"
                                    onClick={handleGoBack}
                                >
                                    <LeftArrow className="w-7 h-auto text-white" />
                                </button>
                            )}
                            <div>
                                <p className="text-white font-poppins text-lg font-medium">
                                    {headerTitle}
                                </p>
                            </div>
                        </IonCol>
                        <div className="right-cms-header">
                            <button
                                onClick={handleQuitConfirmationModal}
                                className="rounded-full mr-[10px] ion-no-padding p-0 shadow-3xl font-poppins font-medium text-base sm:text-lg bg-grayscale-900 text-white px-[20px] py-[4px]"
                            >
                                Quit
                            </button>
                            {currentStep === BoostCMSStepsEnum.create && (
                                <button
                                    onClick={handleNextStep}
                                    className="rounded-full ion-no-padding p-0 shadow-3xl font-poppins font-medium text-base sm:text-lg bg-white text-grayscale-800 px-[20px] py-[4px]"
                                >
                                    Next
                                </button>
                            )}
                            {currentStep === BoostCMSStepsEnum.issueTo && (
                                <button
                                    disabled={isLoading || issueToLength === 0}
                                    onClick={() => handleSaveAndIssue(publishedBoostUri)}
                                    className="rounded-full ion-no-padding p-0 shadow-3xl font-poppins text-xl bg-white text-grayscale-800 px-[20px] py-[4px] disabled:opacity-50"
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </IonRow>
            </IonToolbar>
        </IonHeader>
    );
};

export default BoostCMSHeader;
