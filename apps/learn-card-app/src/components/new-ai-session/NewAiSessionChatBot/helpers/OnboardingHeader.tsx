import React from 'react';

import { useModal } from 'learn-card-base';

import X from '../../../svgs/X';

interface OnboardingHeaderProps {
    title: string;
    onClose?: () => void;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ title, onClose }) => {
    const { closeAllModals } = useModal();

    const handleClose = onClose ?? closeAllModals;

    return (
        <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center justify-between gap-2 bg-white rounded-full shadow-md border-[1px] border-grayscale-200 pl-5 pr-2 py-2 max-w-[calc(100%-32px)]"
            style={{ top: 'calc(16px + env(safe-area-inset-top))' }}
        >
            <h2 className="text-[15px] font-poppins font-[600] text-grayscale-900 m-0 truncate min-w-0">
                {title}
            </h2>
            <button
                type="button"
                onClick={handleClose}
                className="flex-shrink-0 flex items-center justify-center w-[28px] h-[28px] rounded-full text-grayscale-700 hover:bg-grayscale-100"
                aria-label="Close"
            >
                <X className="text-grayscale-800 w-[16px] h-[16px]" strokeWidth="3" />
            </button>
        </div>
    );
};

export default OnboardingHeader;
