import React from 'react';

import VerificationFailedIcon from '../../assets/images/RedXCircle.svg';
import VerificationPassedIcon from '../../assets/images/GreenCheckCircle.svg';
import VerificationWarningIcon from '../../assets/images/YellowWarningCircle.svg';

enum VerifiableItemStatus {
    Passed,
    Warning,
    Error,
    Loading,
}

type ValidationItemProps = {
    status?: VerifiableItemStatus;
    expiryDate?: string;
    errorMessage?: string;
};

type VerifiableStateIndicatorProps = {
    status: VerifiableItemStatus;
};

const StatusToColor = {
    [VerifiableItemStatus.Passed]: 'bg-emerald-500',
    [VerifiableItemStatus.Warning]: 'bg-yellow-400',
    [VerifiableItemStatus.Error]: 'bg-rose-600',
    [VerifiableItemStatus.Loading]: 'bg-grayscale-50',
};

const StatusToIcon = {
    [VerifiableItemStatus.Passed]: VerificationPassedIcon,
    [VerifiableItemStatus.Warning]: VerificationWarningIcon,
    [VerifiableItemStatus.Error]: VerificationFailedIcon,
    [VerifiableItemStatus.Loading]: null,
};



export const ValidationStateIndicator: React.FC<VerifiableStateIndicatorProps> = ({ status }) => {
    const bgColor = StatusToColor[status];
    const source = StatusToIcon[status];


    return (
        <div className={`rounded-full w-[30px] h-[30px] ${bgColor}`}>
            <div className="flex items-center justify-center rounded-[50%] bg-white rounded-full overflow-hidden">
                <img
                    className="h-full w-full object-contain p-1"
                    src={source ?? ''}
                    alt="Verification Status Icon"
                />
            </div>
        </div>
    );
};

const VCVerificationPill: React.FC<ValidationItemProps> = ({
    type,
    status = VerifiableItemStatus.Warning,
    expiryDate,
    errorMessage,
}) => {
    return (
        <section className="flex width-full bg-white p-2 px-5 my-3.5 justify-between items-center relative vc-verification-checklist-pill rounded-[22px]">
            <div className="vc-pill-left">
                <p className="status-text">Verification Success</p>
                <p className="vc-pill-text">Issued to Janet Yoon</p>
            </div>
            <div className="vc-pill-right">
                <ValidationStateIndicator status={status} />
            </div>
        </section>
    );
};

export default VCVerificationPill;
