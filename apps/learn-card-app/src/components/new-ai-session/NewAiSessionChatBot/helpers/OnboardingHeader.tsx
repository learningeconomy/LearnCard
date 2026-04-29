import React from 'react';

import { useDeviceTypeByWidth, useModal } from 'learn-card-base';

import X from '../../../svgs/X';

interface OnboardingHeaderProps {
    title: string;
    onClose?: () => void;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ title, onClose }) => {
    const { closeAllModals } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    const handleClose = onClose ?? closeAllModals;

    if (isDesktop) {
        return (
            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center justify-between gap-3 bg-white rounded-full shadow-md border-[1px] border-grayscale-200 pl-5 pr-2 py-2"
            >
                <h2 className="text-[15px] font-poppins font-[600] text-grayscale-900 m-0 whitespace-nowrap">
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
    }

    return (
        <div className="sticky top-0 z-[100] w-full bg-white flex items-center justify-between gap-3 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3">
            <h2 className="text-[17px] font-poppins font-[600] text-grayscale-900 m-0">
                {title}
            </h2>
            <button
                type="button"
                onClick={handleClose}
                className="flex-shrink-0 p-1 -mr-1 text-grayscale-600"
                aria-label="Close"
            >
                <X className="text-grayscale-800 w-[24px] h-[24px]" strokeWidth="3" />
            </button>
        </div>
    );
};

export default OnboardingHeader;
