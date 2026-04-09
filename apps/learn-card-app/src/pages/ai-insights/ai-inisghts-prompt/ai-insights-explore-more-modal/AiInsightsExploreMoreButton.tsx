import React from 'react';

import AiInsightsExploreMoreModal from './AiInsightsExploreMoreModal';

import { useModal, ModalTypes } from 'learn-card-base';

export const AiInsightsExploreMoreButton: React.FC = () => {
    const { newModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });
    const handleExploreMore = () => {
        newModal(<AiInsightsExploreMoreModal />, {
            hideButton: true,
            sectionClassName: '!max-w-[500px]',
        });
    };
    return (
        <div className="w-full flex items-center justify-center">
            <button
                onClick={handleExploreMore}
                className="text-grayscale-700 font-semibold flex items-center gap-[6px]"
            >
                Explore Your Insights
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[16px] h-[16px]"
                >
                    <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
};

export default AiInsightsExploreMoreButton;
