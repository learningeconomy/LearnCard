import React from 'react';

import StarIcon from '../../../svgs/StarIcon';

import { useDeviceTypeByWidth } from 'learn-card-base';

import { useTheme } from '../../../../theme/hooks/useTheme';

export const ViewAssessmentBadgeButton: React.FC<{
    handleViewBadge?: () => void;
    isFinishingAssessment?: boolean;
}> = ({ handleViewBadge, isFinishingAssessment }) => {
    const { isDesktop } = useDeviceTypeByWidth();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div
            className={`w-full items-center justify-center ion-padding flex fade-enter bottom-0 sticky z-50 ${
                isDesktop ? 'bg-white rounded-[20px] shadow-box-bottom' : 'bg-cyan-50'
            }`}
        >
            <button
                disabled={isFinishingAssessment}
                onClick={handleViewBadge}
                className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px] ${
                    isDesktop ? '' : 'mb-4'
                }`}
            >
                {isFinishingAssessment ? 'Finishing Assessment' : 'View Badge'}
                {isFinishingAssessment ? '...' : <StarIcon className="ml-1" />}
            </button>
        </div>
    );
};

export default ViewAssessmentBadgeButton;
