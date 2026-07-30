import React, { useState } from 'react';
import { VerificationItem, VerificationStatusEnum } from '@learncard/types';
import { getColorForVerificationStatus } from '../../helpers/credential.helpers';

import InfoBox from './InfoBox';
import InfoIcon from '../svgs/InfoIcon';
import AcuteCheckmark from '../svgs/AcuteCheckmark';
import ExclamationPoint from '../svgs/ExclamationPoint';
import X from '../svgs/X';
import { capitalize } from '../../helpers/string.helpers';
import { useT } from '../../i18n';

type VerificationRowProps = {
    verification: VerificationItem;
};

/** Map the SDK's English verification messages to i18n keys; unknown messages pass through. */
const MESSAGE_KEYS: Record<string, string> = {
    Valid: 'valid',
    Invalid: 'invalid',
    'Not Revoked': 'notRevoked',
    Revoked: 'revoked',
    Suspended: 'suspended',
    'Does Not Expire': 'doesNotExpire',
    Expired: 'expired',
    Active: 'active',
    'Boost Credential could not be verified.': 'couldNotVerify',
    'Boost Credential could not be verified': 'couldNotVerify',
};

const VerificationRow: React.FC<VerificationRowProps> = ({ verification }) => {
    const [showInfo, setShowInfo] = useState(false);
    const t = useT();
    const statusColor = getColorForVerificationStatus(verification.status);

    const getIcon = () => {
        switch (verification.status) {
            case VerificationStatusEnum.Success:
                return <AcuteCheckmark />;
            case VerificationStatusEnum.Error:
                return <ExclamationPoint />;
            case VerificationStatusEnum.Failed:
                return <X className="w-[15px] h-[15px]" />;
        }
    };

    const statusText = t(`verification.status.${String(verification.status).toLowerCase()}`);
    const translateMessage = (msg?: string): string => {
        if (!msg) return '';
        const key = MESSAGE_KEYS[msg];
        return key ? t(`verification.message.${key}`) : msg;
    };
    const checkLabel = verification.check ? t(`verification.check.${verification.check}`) : '';

    let primaryText = verification.check
        ? `${checkLabel}: ${translateMessage(verification.message)}`
        : translateMessage(verification.message);
    if (verification.status === VerificationStatusEnum.Failed) {
        primaryText = translateMessage(verification.message ?? verification.details ?? '');
    }
    primaryText = capitalize(primaryText);

    const infoText = ''; // if we want certain verifications to have extra explanation, we can set this variable

    return (
        <div className="verification-row flex flex-col gap-[5px] font-poppins border-b-[1px] border-grayscale-200 border-solid w-full py-[10px] last:border-0 last:pb-0">
            <span
                className="font-[700] text-[11px] leading-[16px] uppercase flex items-center gap-[3px] select-none"
                style={{ color: statusColor }}
            >
                {getIcon()}
                {statusText}
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
            <span className="font-[400] text-[14px] leading-[21px] text-grayscale-900">
                {primaryText}
            </span>
        </div>
    );
};

export default VerificationRow;
