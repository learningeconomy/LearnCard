import React from 'react';

import ShareChildInsightsModal from '../child-insights/ShareChildInsightsModal';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import ShareInsightsModal from './ShareInsightsModal';

import { useModal, ModalTypes } from 'learn-card-base';

import { LCNProfile, LCNProfileManager } from '@learncard/types';

export const ShareInsightsCardController: React.FC<{
    childProfile?: LCNProfile;
    childProfileManager?: LCNProfileManager;
}> = ({ childProfile, childProfileManager }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const handleShareInsights = () => {
        if (childProfile && childProfileManager) {
            newModal(
                <ShareChildInsightsModal
                    childProfile={childProfile}
                    childProfileManager={childProfileManager}
                />
            );
            return;
        } else {
            newModal(<ShareInsightsModal />);
        }
    };

    return (
        <button
            onClick={handleShareInsights}
            className="h-full p-6 bg-grayscale-50 flex flex-col items-center justify-center"
        >
            <QRCodeScanner className="text-indigo-600 h-[30px] w-[30px] min-h-[30px] min-w-[30px] mb-2" />
            <span className="text-indigo-600 text-sm leading-[16px] font-semibold">Share</span>
            <span className="text-indigo-600 text-sm leading-[16px] font-semibold">Insights</span>
        </button>
    );
};

export default ShareInsightsCardController;
