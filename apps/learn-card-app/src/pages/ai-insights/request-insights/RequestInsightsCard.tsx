import React from 'react';

import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import RequestInsightsModal from './RequestInsightsModal';

import { useModal, ModalTypes } from 'learn-card-base';

export const RequestInsightsCard: React.FC<{ contractUri: string }> = ({ contractUri }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const handleRequestInsights = () => {
        newModal(<RequestInsightsModal contractUri={contractUri} />);
    };

    return (
        <div
            role="button"
            className="w-full flex items-center justify-center max-h-[100px] h-[100px]"
            onClick={() => handleRequestInsights()}
        >
            <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-start relative shadow-bottom-2-4 overflow-hidden pr-3">
                <button className="h-full pl-6 bg-white flex flex-col items-center justify-center">
                    <QRCodeScanner className="text-grayscale-800 h-[50px] w-[50px] min-h-[50px] min-w-[50px]" />
                </button>

                <div className="w-full flex items-start justify-center flex-col ml-[12px] px-2 text-left">
                    <p className="text-[17px] text-grayscale-900 font-semibold line-clamp-1">
                        Request Insights
                    </p>
                    <p className="text-sm font-poppins text-grayscale-700">
                        Request access to view your students learning insights.
                    </p>
                </div>

                <SkinnyCaretRight className="text-grayscale-400 h-[24px] w-[20px] min-h-[20px] min-w-[20px] pl-" />
            </div>
        </div>
    );
};

export default RequestInsightsCard;
