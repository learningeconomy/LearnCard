import React, { useState } from 'react';

import VerificationRow from './VerificationRow';
import InfoIcon from '../svgs/InfoIcon';
import InfoBox from './InfoBox';

import { VerificationItem } from '@learncard/types';

type VerificationsBoxProps = {
    verificationItems: VerificationItem[];
};

const VerificationsBox: React.FC<VerificationsBoxProps> = ({ verificationItems }) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">
                Credential Verifications
            </h3>
            <button
                className="absolute top-[17px] right-[17px]"
                onClick={() => setShowInfo(!showInfo)}
            >
                <InfoIcon color={showInfo ? '#6366F1' : undefined} />
            </button>
            {showInfo && (
                <InfoBox
                    text="This is what verified credentials are, lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
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
