import React from 'react';
import { VerificationStatus } from 'learn-card-types';

import CircleSpinner from '../Loading/CircleSpinner';
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
    [VerificationStatus.Success]: 'bg-emerald-500',
    [VerificationStatus.Failed]: 'bg-yellow-400',
    [VerificationStatus.Error]: 'bg-rose-600',
};

const StatusToTextColor = {
    [VerificationStatus.Success]: 'text-emerald-700',
    [VerificationStatus.Failed]: 'text-yellow-400',
    [VerificationStatus.Error]: 'text-rose-600',
};

const StatusToIcon = {
    [VerificationStatus.Success]: VerificationPassedIcon,
    [VerificationStatus.Failed]: VerificationWarningIcon,
    [VerificationStatus.Error]: VerificationFailedIcon,
};

const StatusToText = {
    [VerificationStatus.Success]: 'Verification Success',
    [VerificationStatus.Error]: 'Verification Error ',
    [VerificationStatus.Failed]: 'Verification Failed',
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
    status = VerificationStatus.Success,
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
