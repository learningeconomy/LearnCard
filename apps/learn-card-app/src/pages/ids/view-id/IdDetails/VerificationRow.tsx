import React, { useState } from 'react';
import { VerificationItem, VerificationStatusEnum } from '@learncard/types';

import InfoBox from './InfoBox';
import RedXCircle from 'learn-card-base/svgs/RedXCircle';
import WarningCircle from 'learn-card-base/svgs/WarningCircle';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

import { capitalize } from 'learn-card-base';
import { getColorForVerificationStatus } from '../../../../components/creds-bundle/SharedBoostVerificationBlock';
import * as m from '../../../../paraglide/messages.js';

type VerificationRowProps = {
    verification: VerificationItem;
};

// The verification items rendered here are run through `prettifyVerificationItems`
// upstream (VerificationsBox), which emits capitalized `check` labels and English
// `message` strings. Map the known ones to the shared `sdk.verification.*` catalog;
// anything unrecognized passes through as English (mirrors the SDK VerificationRow).
const CHECK_KEYS: Record<string, string> = {
    Proof: 'sdk.verification.check.proof',
    Status: 'sdk.verification.check.status',
    Expiration: 'sdk.verification.check.expiration',
};

const MESSAGE_KEYS: Record<string, string> = {
    Valid: 'sdk.verification.message.valid',
    Invalid: 'sdk.verification.message.invalid',
    'Not Revoked': 'sdk.verification.message.notRevoked',
    Revoked: 'sdk.verification.message.revoked',
    'Does Not Expire': 'sdk.verification.message.doesNotExpire',
    Expired: 'sdk.verification.message.expired',
    Active: 'sdk.verification.message.active',
    'Boost Credential could not be verified.': 'sdk.verification.message.couldNotVerify',
    'Boost Credential could not be verified': 'sdk.verification.message.couldNotVerify',
};

const STATUS_KEYS: Record<string, string> = {
    success: 'sdk.verification.status.success',
    error: 'sdk.verification.status.error',
    failed: 'sdk.verification.status.failed',
};

const resolveKey = (map: Record<string, string>, raw?: string): string => {
    if (!raw) return '';
    const key = map[raw];
    return key ? (m as unknown as Record<string, () => string>)[key]() : raw;
};

const VerificationRow: React.FC<VerificationRowProps> = ({ verification }) => {
    const [showInfo, setShowInfo] = useState(false);
    const statusColor = getColorForVerificationStatus(verification.status);

    const statusLabel = resolveKey(STATUS_KEYS, String(verification.status).toLowerCase());
    const statusText = statusLabel || verification.status;
    const checkLabel = resolveKey(CHECK_KEYS, verification.check);
    const translateMessage = (msg?: string): string => resolveKey(MESSAGE_KEYS, msg);

    const getIcon = () => {
        switch (verification.status) {
            case VerificationStatusEnum.Success:
                return <CircleCheckmark />;
            case VerificationStatusEnum.Error:
                return <WarningCircle />;
            case VerificationStatusEnum.Failed:
                return <RedXCircle />;
        }
    };

    const isFailed = verification.status === VerificationStatusEnum.Failed;
    const messageOnlyOverride = verification.check === verification.message; // only show message if check and message are identical

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
                className="font-[700] text-[14px] font-notoSans flex items-center gap-[3px] select-none"
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

            <span className="flex gap-[4px] text-grayscale-900 text-[14px]">
                {isFailed && translateMessage(verification.message ?? verification.details ?? '')}
                {!isFailed && verification.check && !messageOnlyOverride && (
                    <>
                        <span className="font-notoSans font-[600] text-[14px]">
                            {capitalize(checkLabel)}:
                        </span>
                        <span className="font-notoSans text-[14px]">
                            {translateMessage(verification.message)}
                        </span>
                    </>
                )}
                {!isFailed && (!verification.check || messageOnlyOverride) && (
                    <span className="font-notoSans text-[14px]">
                        {translateMessage(verification.message)}
                    </span>
                )}
            </span>
        </div>
    );
};

export default VerificationRow;
