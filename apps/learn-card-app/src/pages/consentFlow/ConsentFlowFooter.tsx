import React from 'react';

import X from 'learn-card-base/svgs/X';

import { useModal } from 'learn-card-base';
import useTheme from '../../theme/hooks/useTheme';

import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';

type ConsentFlowFooterProps = {
    actionButtonText?: string;
    onActionButtonClick?: () => void;
    actionButtonDisabled?: boolean;
    showCloseModalX?: boolean;

    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;

    showBackButton?: boolean;
    showFullBackButton?: boolean;
    showCloseButtonAlt?: boolean;
    onCloseCallback?: () => void;
    onBackCallback?: () => void;
};

const ConsentFlowFooter: React.FC<ConsentFlowFooterProps> = ({
    actionButtonText,
    onActionButtonClick,
    actionButtonDisabled = false,
    showCloseModalX,
    secondaryButtonText,
    onSecondaryButtonClick,
    showBackButton,
    showFullBackButton,
    showCloseButtonAlt,
    onCloseCallback,
    onBackCallback,
}) => {
    const { closeModal, closeAllModals } = useModal();

    const showActionButton = actionButtonText && onActionButtonClick;
    const showSecondaryButton = secondaryButtonText && onSecondaryButtonClick;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleCloseButton = () => {
        onCloseCallback?.();
        closeModal();
    };

    const handleBackButton = () => {
        onBackCallback?.();
        closeModal();
    };

    return (
        <footer className="absolute bottom-0 left-0 w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white p-[20px] backdrop-blur-[10px] z-50">
            <div className="max-w-[600px] flex gap-[10px] items-center mx-auto">
                {showBackButton && (
                    <button
                        type="button"
                        onClick={handleBackButton}
                        className={`bg-white p-3 h-[45px] rounded-full  flex items-center justify-center shadow-button-bottom text-grayscale-900 ${
                            showFullBackButton ? 'w-full' : 'w-[45px]'
                        }`}
                    >
                        {showFullBackButton ? (
                            'Back'
                        ) : (
                            <SkinnyCaretRight className="text-grayscale-900 h-[45px] w-[45px] rotate-180" />
                        )}
                    </button>
                )}
                {showCloseModalX && (
                    <button
                        onClick={handleCloseButton}
                        className="rounded-full p-[12px] shadow-button-bottom bg-white text-grayscale-700 h-[44px]"
                    >
                        <X className="h-[20px] w-[20px]" />
                    </button>
                )}
                {showSecondaryButton && (
                    <button
                        type="button"
                        className="w-full text-[17px] text-grayscale-900 font-notoSans bg-white shadow-button-bottom rounded-[35px] leading-[24px] tracking-[0.25px] h-[44px]"
                        onClick={onSecondaryButtonClick}
                    >
                        {secondaryButtonText}
                    </button>
                )}
                {showActionButton && (
                    <button
                        type="button"
                        className={`w-full py-[7px] px-[15px] text-[17px] bg-${primaryColor} rounded-[35px] font-notoSans text-white shadow-button-bottom disabled:opacity-60 h-[44px] leading-[24px] tracking-[0.25px] font-[600]`}
                        onClick={onActionButtonClick}
                        disabled={actionButtonDisabled}
                    >
                        {actionButtonText}
                    </button>
                )}
                {showCloseButtonAlt && (
                    <button
                        type="button"
                        className="bg-white p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center mr-2 shadow-button-bottom"
                        onClick={closeAllModals}
                    >
                        <X className="text-grayscale-900 h-[45px] w-[45px]" />
                    </button>
                )}
            </div>
        </footer>
    );
};

export default ConsentFlowFooter;
