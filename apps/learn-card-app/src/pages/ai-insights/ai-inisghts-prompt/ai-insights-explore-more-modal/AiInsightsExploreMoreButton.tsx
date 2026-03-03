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
            <button onClick={handleExploreMore} className="text-grayscale-700 font-semibold">
                Explore more
            </button>
        </div>
    );
};

export default AiInsightsExploreMoreButton;
