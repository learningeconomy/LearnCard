import React, { useState } from 'react';

import { NotificationProps, NotificationTypeStyles } from './types';
import { NotificationTypeEnum } from '../../constants/notifications';

import Checkmark from '../svgs/Checkmark';

export const Notification: React.FC<NotificationProps> = ({
    title,
    issuerImage,
    issueDate,
    className,
    notificationType = NotificationTypeEnum.Achievement,
    onClick = () => {},
}) => {
    const [isClaimed, setIsClaimed] = useState<boolean>(false);

    const handleClaim = () => setIsClaimed(!isClaimed);

    const {
        IconComponent,
        iconCircleStyles,
        textStyles,
        viewButtonStyles,
        claimedButtonStyles,
        unclaimedButtonStyles,
    } = NotificationTypeStyles[notificationType];

    const claimButtonStyles = isClaimed ? claimedButtonStyles : unclaimedButtonStyles;

    return (
        <div
            className={`flex justify-center items-center relative w-full rounded-3xl shadow-2xl py-3 bg-white ${className}`}
        >
            <div
                className={`absolute flex items-center justify-center top-2 right-2 h-8 w-8 overflow-hidden rounded-full z-10 ${iconCircleStyles}`}
            >
                <IconComponent className="h-4/5 text-white" />
            </div>
            <div className="flex flex-col justify-center items-center relative w-11/12">
                <div className="flex flex-row items-center justify-start w-full">
                    <div className="h-12 w-12 max-h-12 max-w-[48px] min-h-[48px] min-w-[48px] overflow-hidden rounded-full">
                        <img
                            src={issuerImage}
                            alt="issuer image"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-left ml-3">
                        <h4
                            className="font-bold tracking-wide line-clamp-1 text-black"
                            data-testid="notification-title"
                        >
                            {title}
                        </h4>
                        <p
                            className={`font-semibold p-0 m-0 leading-none tracking-wide line-clamp-1 ${textStyles}`}
                            data-testid="notification-type"
                        >
                            {notificationType}{' '}
                            <span
                                className="text-grayscale-600 normal-case font-medium text-sm"
                                data-testid="notification-cred-issue-date"
                            >
                                • {issueDate}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full mt-3">
                    <button
                        onClick={onClick}
                        className={`flex-1 rounded-[24px] border-solid border-2 bg-white font-semibold mr-2 py-2 px-3 tracking-wide ${viewButtonStyles}`}
                        role="button"
                        name="notification-view-button"
                    >
                        View
                    </button>
                    <button
                        className={`flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide ${claimButtonStyles}`}
                        onClick={handleClaim}
                        role="button"
                        name="notification-claim-button"
                    >
                        {isClaimed && <Checkmark className="h-[24px] p-0 m-0" />}{' '}
                        {isClaimed ? 'Claimed' : 'Claim'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notification;
