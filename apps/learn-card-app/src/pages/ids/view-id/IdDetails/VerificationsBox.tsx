import React, { useState, useMemo } from 'react';

import VerificationRow from './VerificationRow';
import InfoBox from './InfoBox';
import InfoIcon from 'learn-card-base/svgs/InfoIcon';

import { VerificationItem } from '@learncard/types';
import { prettifyVerificationItems } from 'learn-card-base/helpers/verificationPrettifier';

import useTheme from '../../../../theme/hooks/useTheme';
import * as m from '../../../../paraglide/messages.js';

type VerificationsBoxProps = {
    verificationItems: VerificationItem[];
};

const VerificationsBox: React.FC<VerificationsBoxProps> = ({ verificationItems }) => {
    const [showInfo, setShowInfo] = useState(false);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const prettifiedItems = useMemo(
        () => prettifyVerificationItems(verificationItems),
        [verificationItems]
    );

    return (
        <div className="verifications-box bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom-2-4 px-[15px] py-[20px] w-full relative">
            <h3 className="text-[17px] font-notoSans text-grayscale-900">
                {m['sdk.verification.title']()}
            </h3>
            <button
                className="absolute top-[17px] right-[17px]"
                onClick={e => {
                    e.stopPropagation();
                    setShowInfo(!showInfo);
                }}
            >
                <InfoIcon
                    className={`h-[21px] w-[22px] ${showInfo ? `text-${primaryColor}` : undefined}`}
                />
            </button>
            {showInfo && (
                <InfoBox
                    text={m['sdk.verification.infoText']()}
                    handleClose={() => setShowInfo(false)}
                />
            )}

            {prettifiedItems.map((verification, index) => (
                <VerificationRow key={index} verification={verification} />
            ))}
        </div>
    );
};

export default VerificationsBox;
