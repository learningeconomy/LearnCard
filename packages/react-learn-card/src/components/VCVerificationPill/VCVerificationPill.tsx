import React from 'react';
import { VerificationStatusEnum, type VerificationStatus } from '@learncard/types';

import VerificationFailedIcon from '../../assets/images/RedXCircle.svg';
import VerificationPassedIcon from '../../assets/images/GreenCheckCircle.svg';
import VerificationWarningIcon from '../../assets/images/YellowWarningCircle.svg';

type VerificationDisplayItemProps = {
    status?: VerificationStatus;
    message?: string;
    details?: string;
};

type VerifiableStateIndicatorProps = {
    status: VerificationStatus;
};

const StatusToBgColor = {
    [VerificationStatusEnum.Success]: 'bg-emerald-500',
    [VerificationStatusEnum.Failed]: 'bg-yellow-400',
    [VerificationStatusEnum.Error]: 'bg-rose-600',
};

const StatusToTextColor = {
    [VerificationStatusEnum.Success]: 'text-emerald-700',
    [VerificationStatusEnum.Failed]: 'text-yellow-400',
    [VerificationStatusEnum.Error]: 'text-rose-600',
};

const StatusToIcon = {
    [VerificationStatusEnum.Success]: VerificationPassedIcon,
    [VerificationStatusEnum.Failed]: VerificationWarningIcon,
    [VerificationStatusEnum.Error]: VerificationFailedIcon,
};

const StatusToText = {
    [VerificationStatusEnum.Success]: 'Verification Success',
    [VerificationStatusEnum.Error]: 'Verification Error ',
    [VerificationStatusEnum.Failed]: 'Verification Failed',
};

export const ValidationStateIndicator: React.FC<VerifiableStateIndicatorProps> = ({ status }) => {
    const bgColor = StatusToBgColor[status];
    const source = StatusToIcon[status];

    return (
        <div className={`relative rounded-full w-[30px] h-[30px] ${bgColor}`}>
            <div className="relative w-[100%] h-[100%] flex items-center justify-center rounded-[50%] bg-white rounded-full overflow-hidden">
                <img
                    className="h-full w-full object-contain p-1"
                    src={source ?? ''}
                    alt="Verification Status Icon"
                />
            </div>
        </div>
    );
};

const VCVerificationPill: React.FC<VerificationDisplayItemProps> = ({
    message = '',
    details,
    status = VerificationStatusEnum.Success,
}) => {
    const statusColor = StatusToTextColor[status];
    const statusInfoText = StatusToText[status];

    return (
        <section className="flex width-full bg-white p-2 px-5 my-3.5 justify-between items-center relative vc-verification-checklist-pill rounded-[22px]">
            <div className="vc-pill-left">
                <p className={`text-[10px] font-bold status-text uppercase ${statusColor}`}>
                    {statusInfoText}
                </p>

                <p className="text-[12px] text-grayscale-900 vc-pill-text">{message}</p>

                {details && <p className="text-[12px] text-gray-600"> {details}</p>}
            </div>
            <div className="vc-pill-right">
                <ValidationStateIndicator status={status} />
            </div>
        </section>
    );
};

export default VCVerificationPill;
