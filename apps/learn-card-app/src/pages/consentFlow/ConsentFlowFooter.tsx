import React from 'react';
import { useModal } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';

import useTheme from '../../theme/hooks/useTheme';

type ConsentFlowFooterProps = {
    actionButtonText?: string;
    onActionButtonClick?: () => void;
    actionButtonDisabled?: boolean;
    showCloseModalX?: boolean;

    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;
};

const ConsentFlowFooter: React.FC<ConsentFlowFooterProps> = ({
    actionButtonText,
    onActionButtonClick,
    actionButtonDisabled = false,
    showCloseModalX,
    secondaryButtonText,
    onSecondaryButtonClick,
}) => {
    const { closeModal } = useModal();

    const showActionButton = actionButtonText && onActionButtonClick;
    const showSecondaryButton = secondaryButtonText && onSecondaryButtonClick;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <footer className="absolute bottom-0 left-0 w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white p-[20px] backdrop-blur-[10px] z-50">
            <div className="max-w-[600px] flex gap-[10px] items-center mx-auto">
                {showCloseModalX && (
                    <button
                        onClick={closeModal}
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
            </div>
        </footer>
    );
};

export default ConsentFlowFooter;
