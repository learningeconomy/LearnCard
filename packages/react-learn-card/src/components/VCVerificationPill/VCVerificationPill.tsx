import React from 'react';
import CircleSpinner from '../Loading/CircleSpinner';
import VerificationFailedIcon from '../../assets/images/RedXCircle.svg';
import VerificationPassedIcon from '../../assets/images/GreenCheckCircle.svg';
import VerificationWarningIcon from '../../assets/images/YellowWarningCircle.svg';

enum VerifiableItemStatus {
    Success,
    Failed,
    Error,
    Loading,
}

type ValidationDisplayItemProps = {
    status?: VerifiableItemStatus;
    message?: string;
    details?: string;
};

type VerifiableStateIndicatorProps = {
    status: VerifiableItemStatus;
};

const StatusToBgColor = {
    [VerifiableItemStatus.Success]: 'bg-emerald-500',
    [VerifiableItemStatus.Failed]: 'bg-yellow-400',
    [VerifiableItemStatus.Error]: 'bg-rose-600',
    [VerifiableItemStatus.Loading]: 'bg-grayscale-50',
};

const StatusToTextColor = {
    [VerifiableItemStatus.Success]: 'text-emerald-700',
    [VerifiableItemStatus.Failed]: 'text-yellow-400',
    [VerifiableItemStatus.Error]: 'text-rose-600',
    [VerifiableItemStatus.Loading]: 'text-white',
};

const StatusToIcon = {
    [VerifiableItemStatus.Success]: VerificationPassedIcon,
    [VerifiableItemStatus.Failed]: VerificationWarningIcon,
    [VerifiableItemStatus.Error]: VerificationFailedIcon,
    [VerifiableItemStatus.Loading]: null,
};

const StatusToText = {
    [VerifiableItemStatus.Success]: 'Verification Success',
    [VerifiableItemStatus.Error]: 'Verification Error ',
    [VerifiableItemStatus.Failed]: 'Verification Failed',
    [VerifiableItemStatus.Loading]: null,
};

export const ValidationStateIndicator: React.FC<VerifiableStateIndicatorProps> = ({ status }) => {
    const bgColor = StatusToBgColor[status];
    const source = StatusToIcon[status];

    return (
        <div className={`relative rounded-full w-[30px] h-[30px] ${bgColor}`}>
            <div className="relative w-[100%] h-[100%] flex items-center justify-center rounded-[50%] bg-white rounded-full overflow-hidden">
                {status !== VerifiableItemStatus.Loading && (
                    <img
                        className="h-full w-full object-contain p-1"
                        src={source ?? ''}
                        alt="Verification Status Icon"
                    />
                )}
                {status === VerifiableItemStatus.Loading && (
                    <CircleSpinner size={30} marginOffset={1} thickness={3} color={'#41CEF2'} />
                )}
            </div>
        </div>
    );
};

const VCVerificationPill: React.FC<ValidationDisplayItemProps> = ({
    message = 'Verification in progress....',
    details,
    status = VerifiableItemStatus.Loading,
}) => {
    const statusColor = StatusToTextColor[status];
    const statusInfoText = StatusToText[status];
    return (
        <section className="flex width-full bg-white p-2 px-5 my-3.5 justify-between items-center relative vc-verification-checklist-pill rounded-[22px]">
            <div className="vc-pill-left">
                {status !== VerifiableItemStatus.Loading && (
                    <p className={`text-[10px] font-bold status-text uppercase ${statusColor}`}>
                        {statusInfoText}
                    </p>
                )}
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
