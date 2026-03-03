import React from 'react';

import { IonHeader, IonToolbar, IonRow, IonCol } from '@ionic/react';

import { BoostUserTypeEnum, boostCategoryOptions } from '../../boost-options/boostOptions';
import { BoostCMSStepsEnum } from '../../boost';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

type BoostCMSHeaderProps = {
    boostUserType: BoostUserTypeEnum | string | null;
    selectedVCType: BoostCategoryOptionsEnum | string;
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
    const { title } = boostCategoryOptions[selectedVCType as BoostCategoryOptionsEnum];
    let headerTitle = '';

    if (currentStep === BoostCMSStepsEnum.create) {
        headerTitle = `${title}`;
    } else if (currentStep === BoostCMSStepsEnum.publish) {
        headerTitle = `Publish ${title}`;
    } else if (currentStep === BoostCMSStepsEnum.issueTo) {
        headerTitle = `Send ${title}`;
    } else if (currentStep === BoostCMSStepsEnum.confirmation) {
        headerTitle = `${title} Confirmation`;
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
                                <p className="text-white text-lg font-notoSans">{headerTitle}</p>
                            </div>
                        </IonCol>
                        <div className="right-cms-header">
                            <button
                                onClick={handleQuitConfirmationModal}
                                className="rounded-full mr-[10px] ion-no-padding p-0 shadow-3xl font-medium text-lg bg-grayscale-900 text-white px-[24px] py-[4px] font-notoSans"
                            >
                                Quit
                            </button>
                            {currentStep === BoostCMSStepsEnum.create && (
                                <button
                                    onClick={handleNextStep}
                                    className="rounded-full ion-no-padding p-0 shadow-3xl text-lg font-medium bg-white text-grayscale-800 px-[24px] py-[4px] font-notoSans"
                                >
                                    Next
                                </button>
                            )}
                            {currentStep === BoostCMSStepsEnum.issueTo && (
                                <button
                                    disabled={isLoading || issueToLength === 0}
                                    onClick={() => handleSaveAndIssue(publishedBoostUri)}
                                    className="rounded-full ion-no-padding p-0 shadow-3xl text-xl font-medium bg-white text-grayscale-800 px-[20px] py-[4px] disabled:opacity-50 font-notoSans"
                                >
                                    Send
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
