import React, { useState } from 'react';
import { VerificationItem, VerificationStatusEnum } from '@learncard/types';
import { getColorForVerificationStatus } from '../../helpers/credential.helpers';

import InfoBox from './InfoBox';
import InfoIcon from '../svgs/InfoIcon';
import AcuteCheckmark from '../svgs/AcuteCheckmark';
import ExclamationPoint from '../svgs/ExclamationPoint';
import X from '../svgs/X';
import { capitalize } from '../../helpers/string.helpers';

type VerificationRowProps = {
    verification: VerificationItem;
};

const VerificationRow: React.FC<VerificationRowProps> = ({ verification }) => {
    const [showInfo, setShowInfo] = useState(false);
    const statusColor = getColorForVerificationStatus(verification.status);

    const getIcon = () => {
        switch (verification.status) {
            case VerificationStatusEnum.Success:
                return <AcuteCheckmark />;
            case VerificationStatusEnum.Error:
                return <ExclamationPoint />;
            case VerificationStatusEnum.Failed:
                return <X />;
        }
    };

    let primaryText = `${verification.check}: ${verification.message}`;
    if (verification.status === VerificationStatusEnum.Failed) {
        primaryText = verification.message ?? verification.details ?? '';
    }
    primaryText = capitalize(primaryText);

    const infoText = 'Placeholder verification text.';

    return (
        <div className="flex flex-col gap-[5px] font-poppins border-b-[1px] bord-grayscale-200 border-solid w-full py-[10px] last:border-0 last:pb-0">
            <span
                className="font-[700] text-[11px] leading-[16px] uppercase flex items-center gap-[3px]"
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
                <InfoBox text={infoText} handleClose={() => setShowInfo(false)} />
            )}
            <span className="font-[400] text-[14px] leading-[21px] text-grayscale-900">
                {primaryText}
            </span>
        </div>
    );
};

export default VerificationRow;
