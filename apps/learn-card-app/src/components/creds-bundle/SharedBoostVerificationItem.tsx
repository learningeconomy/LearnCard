import React from 'react';

import X from '../svgs/X';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import ExclamationPoint from '../svgs/ExclamationPoint';
import { VerificationItem, VerificationStatusEnum } from '@learncard/types';

export const SharedBoostVerificationItem: React.FC<{
    verification: VerificationItem;
    hideBorder?: boolean;
}> = ({ verification, hideBorder = false }) => {
    let check = verification.check;
    let message: string | undefined = '';

    message = verification?.check ? verification?.message : verification.message;

    if (verification.status === VerificationStatusEnum.Failed) {
        message = '';
    }

    const getIcon = () => {
        switch (verification.status) {
            case VerificationStatusEnum.Success:
                return <Checkmark className="text-emerald-600 w-[20px] h-[20px] mr-1" />;
            case VerificationStatusEnum.Error:
                return <ExclamationPoint className="text-red-600 w-[20px] h-[20px] mr-1" />;
            case VerificationStatusEnum.Failed:
                return <X className="text-red-600 w-[20px] h-[20px] mr-1" />;
        }
    };

    const getTextColor =
        verification?.status === VerificationStatusEnum.Success
            ? 'text-emerald-600'
            : 'text-red-600';

    // overrides the default message  for authentic boosts
    if (
        verification.check === 'Boost is Authentic. Verified by LearnCard Network.' &&
        verification.status === VerificationStatusEnum.Success
    ) {
        message = verification.check ? `${verification.message}` : verification.message;

        return (
            <div
                className={`w-full flex flex-col items-start justify-center border-grayscale-200 mb-2 pb-2 ${
                    hideBorder ? 'border-none' : 'border-b-[1px]'
                }`}
            >
                <p
                    className={`flex items-center justify-between text-sm font-bold mb-1 normal ${getTextColor}`}
                >
                    {getIcon()} {verification?.status}
                </p>
                <p className="flex items-center justify-between text-sm mb-1 capitalize font-semibold text-grayscale-900">
                    Authentic Boost:
                </p>
                <p className="flex items-center justify-between text-sm mb-1 capitalize text-grayscale-900">
                    Verified by the LearnCard Network
                </p>
            </div>
        );
    }

    return (
        <div
            className={`w-full flex flex-col items-start justify-center border-grayscale-200 mb-2 pb-2 ${
                hideBorder ? 'border-none' : 'border-b-[1px]'
            }`}
        >
            <p
                className={`flex items-center justify-between text-sm font-bold mb-1 normal ${getTextColor}`}
            >
                {getIcon()} {verification?.status}
            </p>
            <p className={`flex ${check === 'Boost Authenticity' ? 'flex-col' : 'flex-row'}  items-start justify-between text-sm mb-1 capitalize text-grayscale-900`}>
                {check}:&nbsp;
                {message && <span className="font-semibold text-wrap">{message}</span>}
            </p>
        </div>
    );
};

export default SharedBoostVerificationItem;
