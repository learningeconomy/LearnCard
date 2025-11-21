import React from 'react';

import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';
import EndorsementRequestFormFooter from './EndorsementRequestFormFooter';

export const EndorsementRequestSuccess: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white bg-opacity-10 px-4">
            <div className="w-full flex flex-col items-center justify-center  bg-white rounded-[20px] px-4 py-8 gap-2">
                <EndorsmentThumbWithCircle
                    className="w-[50px] h-[50px] text-grayscale-900"
                    fill="#E2E3E9"
                />
                <h1 className="text-[22px] font-semibold text-grayscale-900">Request Sent!</h1>
                <p className="text-grayscale-900 text-center text-[17px]">
                    You’ll be notified when the <br /> endorsement is ready.
                </p>
            </div>

            <EndorsementRequestFormFooter handleEndorsementSubmit={closeModal} />
        </div>
    );
};

export default EndorsementRequestSuccess;
