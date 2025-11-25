import React, { useState } from 'react';

import VerificationRow from './VerificationRow';
import InfoBox from './InfoBox';
import InfoIcon from 'learn-card-base/svgs/InfoIcon';

import { VerificationItem } from '@learncard/types';

type VerificationsBoxProps = {
    verificationItems: VerificationItem[];
};

const VerificationsBox: React.FC<VerificationsBoxProps> = ({ verificationItems }) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="verifications-box bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[17px] font-notoSans text-grayscale-900">
                Credential Verifications
            </h3>
            <button
                className="absolute top-[17px] right-[17px]"
                onClick={e => {
                    e.stopPropagation();
                    setShowInfo(!showInfo);
                }}
            >
                <InfoIcon
                    className={`h-[21px] w-[22px] ${showInfo ? 'text-indigo-500' : undefined}`}
                />
            </button>
            {showInfo && (
                <InfoBox
                    text="Credential verifications check the cryptographic proof of digital credentials to ensure their authenticity and accuracy."
                    handleClose={() => setShowInfo(false)}
                />
            )}

            {verificationItems.map((verification, index) => (
                <VerificationRow key={index} verification={verification} />
            ))}
        </div>
    );
};

export default VerificationsBox;
