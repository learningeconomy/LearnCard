import React, { useState } from 'react';
import { VerificationItem, VerificationStatusEnum } from '@learncard/types';
import { getColorForVerificationStatus } from '../../helpers/credential.helpers';

import InfoBox from './InfoBox';
import InfoIcon from '../svgs/InfoIcon';
import AcuteCheckmark from '../svgs/AcuteCheckmark';
import ExclamationPoint from '../svgs/ExclamationPoint';
import X from '../svgs/X';
import { capitalize } from '../../helpers/string.helpers';
import CircleCheckmark from '../svgs/CircleCheckmark';

type VerificationRowProps = {
    verification: VerificationItem;
};

const VerificationRow: React.FC<VerificationRowProps> = ({ verification }) => {
    const [showInfo, setShowInfo] = useState(false);
    const statusColor = getColorForVerificationStatus(verification.status);

    const getIcon = () => {
        switch (verification.status) {
            case VerificationStatusEnum.Success:
                return <CircleCheckmark />;
            case VerificationStatusEnum.Error:
                return <ExclamationPoint />;
            case VerificationStatusEnum.Failed:
                return <X />;
        }
    };

    const isFailed = verification.status === VerificationStatusEnum.Failed;
    const messageOnlyOverride = verification.check === verification.message; // only show message if check and message are identical

    let primaryText = verification.check
        ? `${verification.check}: ${verification.message}`
        : verification.message;
    if (verification.status === VerificationStatusEnum.Failed) {
        primaryText = verification.message ?? verification.details ?? '';
    }
    primaryText = capitalize(primaryText);

    const infoText = ''; // if we want certain verifications to have extra explanation, we can set this variable

    return (
        <div className="verification-row flex flex-col gap-[5px] font-poppins border-b-[1px] border-grayscale-200 border-solid w-full py-[10px] last:border-0 last:pb-0">
            <span
                className="font-[700] text-[14px] font-notoSans flex items-center gap-[3px] select-none"
                style={{ color: statusColor }}
            >
                {getIcon()}
                {verification.status}
                {infoText && (
                    <button className="ml-auto" onClick={() => setShowInfo(!showInfo)}>
                        <InfoIcon color={statusColor} />
                    </button>
                )}
            </span>
            {showInfo && infoText && (
                <InfoBox
                    text={infoText}
                    handleClose={() => setShowInfo(false)}
                    backgroundColor={statusColor}
                />
            )}

            <span className="flex gap-[4px] text-grayscale-900 text-[14px]">
                {isFailed && (verification.message ?? verification.details ?? '')}
                {!isFailed && verification.check && !messageOnlyOverride && (
                    <>
                        <span className="font-notoSans font-[600] text-[14px]">
                            {capitalize(verification.check)}:
                        </span>
                        <span className="font-notoSans text-[14px]">{verification.message}</span>
                    </>
                )}
                {!isFailed && (!verification.check || messageOnlyOverride) && (
                    <span className="font-notoSans text-[14px]">{verification.message}</span>
                )}
            </span>
        </div>
    );
};

export default VerificationRow;
