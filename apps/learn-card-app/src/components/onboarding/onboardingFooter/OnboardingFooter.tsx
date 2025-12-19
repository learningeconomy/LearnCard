import React from 'react';

import { IonFooter, IonToolbar } from '@ionic/react';

import { useModal } from 'learn-card-base';

import { LearnCardRolesEnum, OnboardingStepsEnum } from '../onboarding.helpers';

export const OnboardingFooter: React.FC<{
    step?: OnboardingStepsEnum;
    role?: LearnCardRolesEnum | null;
    setStep?: (step: OnboardingStepsEnum) => void;
    text?: string;
    onClick?: () => void;
    showDisclaimer?: boolean;
    showBackButton?: boolean;
    showCloseButton?: boolean;
    overrideSkip?: () => void;
    disabled?: boolean;
}> = ({
    step = OnboardingStepsEnum,
    role,
    setStep,
    text = 'Continue',
    onClick,
    showDisclaimer = false,
    showBackButton = false,
    showCloseButton = false,
    overrideSkip,
    disabled,
}) => {
    const { closeModal } = useModal();
    const isDisabled = (disabled ?? false) || (step === OnboardingStepsEnum.selectRole && !role);
    const activeStyles = isDisabled
        ? 'bg-grayscale-200 text-grayscale-500 cursor-not-allowed'
        : 'bg-emerald-700 text-white';

    const handleContinue = () => {
        if (step === OnboardingStepsEnum.selectRole) {
            setStep?.(OnboardingStepsEnum.joinNetwork);
        }
    };

    const handleGoBack = () => {
        if (step === OnboardingStepsEnum.joinNetwork) {
            setStep?.(OnboardingStepsEnum.selectRole);
        }
    };

    if (showCloseButton) {
        return (
            <div className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] p-[20px] absolute bottom-0 bg-white">
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex flex-col items-center justify-between max-w-[600px] ion-padding">
                        <button
                            onClick={closeModal}
                            className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <IonFooter className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] ion-padding bg-white">
            <IonToolbar color="transparent">
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex flex-col items-center justify-between max-w-[600px]">
                        <div className="w-full flex items-center justify-center">
                            {showBackButton && (
                                <button
                                    onClick={handleGoBack}
                                    className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                                >
                                    Back
                                </button>
                            )}

                            <button
                                disabled={isDisabled}
                                onClick={() => {
                                    if (onClick) {
                                        onClick?.();
                                    } else {
                                        handleContinue();
                                    }
                                }}
                                className={`py-[9px] pl-[20px] font-semibold pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-grayscale-900 w-full flex gap-[5px] justify-center mr-2 shadow-button-bottom ${activeStyles}`}
                            >
                                {text}
                            </button>
                        </div>

                        <button
                            className="text-grayscale-500 my-4 font-poppins text-base"
                            onClick={overrideSkip ? overrideSkip : closeModal}
                        >
                            Skip For Now
                        </button>
                    </div>
                </div>
            </IonToolbar>
        </IonFooter>
    );
};

export default OnboardingFooter;
