import React from 'react';
import { useHistory } from 'react-router-dom';
import {
    IonCol,
    IonContent,
    IonFooter,
    IonGrid,
    IonHeader,
    IonPage,
    IonRow,
    IonToolbar,
} from '@ionic/react';
import { useModal } from 'learn-card-base';
import { BoostCMSState, BoostCMSStepsEnum } from '../../boost';
import {
    BOOST_CATEGORY_TO_WALLET_ROUTE,
    boostCategoryOptions,
} from '../../boost-options/boostOptions';
import ModalLayout from '../../../layout/ModalLayout';

export const BoostCMSConfirmationPrompt: React.FC<{
    state: BoostCMSState;
    handleSaveAndQuit: (goBack: boolean) => void;
    handleQuit?: () => void;
    currentStep: BoostCMSStepsEnum;
    isEditMode: boolean;
    isSaveLoading: boolean;
    skipHistoryGoBack?: boolean;
}> = ({
    state,
    handleSaveAndQuit,
    handleQuit,
    currentStep,
    isEditMode = false,
    isSaveLoading,
    skipHistoryGoBack,
}) => {
    const history = useHistory();
    const { closeModal, closeAllModals } = useModal();

    const { title } = boostCategoryOptions[state?.basicInfo?.type];

    const _handleQuit = () => {
        if (handleQuit) {
            closeModal();
            handleQuit?.();
        } else {
            closeAllModals();
            if (!skipHistoryGoBack) {
                history.goBack();
            }
        }
    };

    const handleQuitAndSave = async () => {
        closeModal();
        await handleSaveAndQuit(true);
    };

    let promptText = null;

    if (currentStep === BoostCMSStepsEnum.issueTo) {
        promptText =
            'Your boost is published and no more edits can be made. You can return to issuing or quit to start over.';
    }

    const buttonText =
        currentStep === BoostCMSStepsEnum.issueTo ? 'Continue Issuing' : 'Continue Editing';
    const quitWithoutSavingText =
        currentStep === BoostCMSStepsEnum.issueTo ? 'Issue Later' : 'Quit Without Saving';

    return (
        <section className="py-5 bg-white">
            <div className="flex flex-col items-center justify-center w-full px-4">
                <div className="w-full flex flex-col items-center justify-center">
                    <div className="flex flex-col">
                        <div className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] text-base font-bold text-black">
                                SCOUTPASS
                            </h6>
                        </div>
                    </div>
                    <h6 className="font-semi-bold text-black text-2xl mb-4 mt-4">Are you sure?</h6>
                    {promptText}
                    {currentStep !== BoostCMSStepsEnum.confirmation &&
                        currentStep !== BoostCMSStepsEnum.issueTo &&
                        !isEditMode && (
                            <button
                                disabled={isSaveLoading}
                                onClick={handleQuitAndSave}
                                className="flex items-center font-medium justify-center text-white rounded-full px-[64px] py-[10px] bg-sp-purple-base text-lg w-full shadow-lg"
                            >
                                Save & Quit
                            </button>
                        )}
                    <button
                        onClick={_handleQuit}
                        className="flex items-center font-medium justify-center text-white rounded-full px-[64px] py-[10px] bg-grayscale-900 text-lg w-full shadow-lg mt-4"
                    >
                        {quitWithoutSavingText}
                    </button>
                    {currentStep === BoostCMSStepsEnum.confirmation && (
                        <button
                            onClick={() => {
                                closeModal();
                                history.push(
                                    `/${
                                        BOOST_CATEGORY_TO_WALLET_ROUTE?.[state?.basicInfo?.type]
                                    }?managed=true`
                                );
                            }}
                            className="flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-indigo-500 text-lg w-full shadow-lg mt-4"
                        >
                            Return to Wallet
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BoostCMSConfirmationPrompt;
