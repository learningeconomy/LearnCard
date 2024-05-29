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
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full">
            <div className="flex w-full items-center">
                <h3 className="text-[17px] text-grayscale-900 font-poppins">Verifications</h3>
                <button className="ml-auto" onClick={() => setShowInfo(!showInfo)}>
                    <InfoIcon color={showInfo ? '#6366F1' : undefined} />
                </button>
            </div>
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
