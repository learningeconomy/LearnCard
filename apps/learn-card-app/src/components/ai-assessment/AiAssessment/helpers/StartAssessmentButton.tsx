import React from 'react';

import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';
import X from '../../../svgs/X';

import { useDeviceTypeByWidth, useModal } from 'learn-card-base';

import { useTheme } from '../../../../theme/hooks/useTheme';

export const StartAssessmentButton: React.FC<{ handleStartAssessment?: () => void }> = ({
    handleStartAssessment,
}) => {
    const { isDesktop, isMobile } = useDeviceTypeByWidth();
    const { closeModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div
            className={`w-full flex-col items-center justify-center ion-padding flex fade-enter bottom-0 sticky z-50 ${
                isDesktop ? 'bg-indigo-50 rounded-[20px] shadow-box-bottom' : 'bg-indigo-50'
            }`}
        >
            <p className="text-grayscale-900 text-[17px] xs:text-sm text-center font-semibold flex items-center justify-center mb-[20px]">
                Ready to check in on what you've learned?
            </p>
            <div className="flex items-center justify-center w-full">
                {isMobile && (
                    <button
                        onClick={closeModal}
                        className={`rounded-full bg-white shadow-3xl mr-4 min-w-[52px] min-h-[52px] flex items-center justify-center ${
                            isDesktop ? '' : 'mb-4'
                        }`}
                    >
                        <X className="text-grayscale-800 w-[20px] h-[20px]" strokeWidth="5" />
                    </button>
                )}
                <button
                    onClick={handleStartAssessment}
                    className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold px-4 py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px] ${
                        isDesktop ? '' : 'mb-4'
                    }`}
                >
                    Let's Go
                    <NewAiSessionIcon className="ml-1" />
                </button>
            </div>
        </div>
    );
};

export default StartAssessmentButton;
