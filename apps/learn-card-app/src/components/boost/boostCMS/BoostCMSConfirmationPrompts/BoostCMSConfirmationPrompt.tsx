import React from 'react';
import { useHistory } from 'react-router-dom';
import { useModal } from 'learn-card-base';
import { BoostCMSState, BoostCMSStepsEnum } from '../../boost';
import { BOOST_CATEGORY_TO_WALLET_ROUTE } from '../../boost-options/boostOptions';

import useTheme from '../../../../theme/hooks/useTheme';

type BoostCMSConfirmationPromptProps = {
    state: BoostCMSState;
    handleSaveAndQuit: (goBack: boolean) => void;
    currentStep: BoostCMSStepsEnum;
    isEditMode: boolean;
    isSaveLoading: boolean;
    clearLocalSave?: () => void;
    onIntentionalNavigation?: () => void;
};

export const BoostCMSConfirmationPrompt: React.FC<BoostCMSConfirmationPromptProps> = ({
    state,
    handleSaveAndQuit,
    currentStep,
    isEditMode = false,
    isSaveLoading,
    clearLocalSave,
    onIntentionalNavigation,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { closeModal } = useModal();
    const history = useHistory();

    const handleQuit = () => {
        clearLocalSave?.();
        onIntentionalNavigation?.();
        closeModal();
        history.goBack();
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

    const quitWithoutSavingText =
        currentStep === BoostCMSStepsEnum.issueTo ? 'Issue Later' : 'Quit Without Saving';

    return (
        <section className="pt-[36px] pb-[16px]">
            <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full flex flex-col items-center justify-center px-4 text-grayscale-900">
                    <div className="flex flex-col">
                        <div className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] text-base font-bold text-black">
                                LEARNCARD
                            </h6>
                        </div>
                    </div>

                    <h6 className="font-semi-bold text-black font-poppins text-xl mb-4 mt-4">
                        Are you sure?
                    </h6>

                    {promptText}

                    {currentStep !== BoostCMSStepsEnum.confirmation &&
                        currentStep !== BoostCMSStepsEnum.issueTo &&
                        !isEditMode && (
                            <button
                                disabled={isSaveLoading}
                                onClick={handleQuitAndSave}
                                className="flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-emerald-700 font-poppins font-medium text-xl w-full shadow-lg"
                            >
                                Save & Quit
                            </button>
                        )}
                    <button
                        onClick={handleQuit}
                        className="flex items-center justify-center text-white rounded-full px-[50px] py-[10px] bg-grayscale-900 font-poppins font-medium text-xl w-full shadow-lg mt-4"
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
                            className={`flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-${primaryColor} font-poppins text-xl w-full shadow-lg normal mt-4`}
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
