import React from 'react';

import { useModal } from 'learn-card-base';

import X from '../../../svgs/X';

interface OnboardingHeaderProps {
    title: string;
    onClose?: () => void;
}

/**
 * Sticky header used for the "New Topic" onboarding Q&A flow.
 * Replaces the legacy bottom-centered X close button (NewAiSessionFooter)
 * with a Figma-accurate top header (title on left, X close on right).
 */
export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ title, onClose }) => {
    const { closeAllModals } = useModal();

    const handleClose = onClose ?? closeAllModals;

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
