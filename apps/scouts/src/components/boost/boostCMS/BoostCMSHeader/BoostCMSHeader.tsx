import React from 'react';

import { IonHeader, IonToolbar, IonRow, IonCol } from '@ionic/react';

import { BoostUserTypeEnum, boostCategoryOptions } from '../../boost-options/boostOptions';
import { BoostCMSStepsEnum } from '../../boost';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import * as m from '../../../../paraglide/messages.js';

type BoostCMSHeaderProps = {
    boostUserType: BoostUserTypeEnum | string | null;
    selectedVCType: BoostCategoryOptionsEnum | string;
    currentStep: BoostCMSStepsEnum;
    handleNextStep: () => void;
    handleSaveAsDraft?: () => void;
    handlePublish?: () => void;
    handlePrevStep: () => void;
    handleConfirmationModal: () => void;
    publishedBoostUri: string | null;
    handleSaveAndIssue: (boostUri?: string) => void;
    isLoading: boolean;
    isSaveLoading?: boolean;
    isPublishLoading?: boolean;
    issueToLength: number;
    returnToParentAfterSave?: boolean;
};

const BoostCMSHeader: React.FC<BoostCMSHeaderProps> = ({
    selectedVCType,
    boostUserType,
    currentStep,
    handleNextStep,
    handleSaveAsDraft,
    handlePublish,
    handlePrevStep,
    handleConfirmationModal,
    publishedBoostUri,
    handleSaveAndIssue,
    isLoading,
    isSaveLoading,
    isPublishLoading,
    issueToLength,
    returnToParentAfterSave = false,
}) => {
    const { title } = boostCategoryOptions[selectedVCType as BoostCategoryOptionsEnum];
    let headerTitle = '';

    if (currentStep === BoostCMSStepsEnum.create) {
        headerTitle = `${title}`;
    } else if (currentStep === BoostCMSStepsEnum.publish) {
        headerTitle = m['boostCMS.publishTitle']({ title });
    } else if (currentStep === BoostCMSStepsEnum.issueTo) {
        headerTitle = m['boostCMS.sendTitle']({ title });
    } else if (currentStep === BoostCMSStepsEnum.confirmation) {
        headerTitle = m['boostCMS.confirmTitle']({ title });
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
                        <IonCol className="w-full flex justify-start items-center !px-0">
                            {(currentStep === BoostCMSStepsEnum.publish ||
                                (currentStep === BoostCMSStepsEnum.create &&
                                    returnToParentAfterSave)) && (
                                <button
                                    className="text-white p-0 mr-[1px] z-50"
                                    onClick={handleGoBack}
                                    aria-label="Quit boost creation"
                                >
                                    <LeftArrow className="rtl-mirror w-7 h-auto text-white" />
                                </button>
                            )}
                            <div>
                                <p className="text-white text-lg font-notoSans">{headerTitle}</p>
                            </div>
                        </IonCol>
                        <div className="right-cms-header flex items-center gap-2">
                            {!returnToParentAfterSave && (
                                <button
                                    onClick={handleQuitConfirmationModal}
                                    className="rounded-full ion-no-padding p-0 shadow-3xl font-medium text-lg bg-grayscale-900 text-white px-[24px] py-[4px] font-notoSans"
                                >
                                    {m['boostCMS.quit']()}
                                </button>
                            )}
                            {currentStep === BoostCMSStepsEnum.create &&
                                (returnToParentAfterSave ? (
                                    <>
                                        <button
                                            disabled={isSaveLoading || isPublishLoading}
                                            onClick={handleSaveAsDraft}
                                            className="rounded-full ion-no-padding p-0 shadow-3xl text-sm font-medium border border-grayscale-300 text-white px-[16px] py-[6px] font-notoSans disabled:opacity-50"
                                        >
                                            {isSaveLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {m['common.saving']()}
                                                </span>
                                            ) : (
                                                m['boostCMS.saveDraft']()
                                            )}
                                        </button>
                                        <button
                                            disabled={isSaveLoading || isPublishLoading}
                                            onClick={handlePublish}
                                            className="rounded-full ion-no-padding p-0 shadow-3xl text-lg font-medium bg-white text-grayscale-800 px-[24px] py-[4px] font-notoSans disabled:opacity-50"
                                        >
                                            {isPublishLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-800 rounded-full animate-spin" />
                                                    {m['boostCMS.publishing']()}
                                                </span>
                                            ) : (
                                                m['common.publish']()
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleNextStep}
                                        className="rounded-full ion-no-padding p-0 shadow-3xl text-lg font-medium bg-white text-grayscale-800 px-[24px] py-[4px] font-notoSans"
                                    >
                                        {m['common.next']()}
                                    </button>
                                ))}
                            {currentStep === BoostCMSStepsEnum.issueTo && (
                                <button
                                    disabled={isLoading || issueToLength === 0}
                                    onClick={() => handleSaveAndIssue(publishedBoostUri)}
                                    className="rounded-full ion-no-padding p-0 shadow-3xl text-xl font-medium bg-white text-grayscale-800 px-[20px] py-[4px] disabled:opacity-50 font-notoSans"
                                >
                                    {m['boost.send']()}
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
