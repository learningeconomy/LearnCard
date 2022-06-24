import React, { useState } from 'react';

import { NotificationProps, NotificationTypeStyles } from './types';
import { NotificationTypeEnum } from '../../constants/notifications';

import Checkmark from '../svgs/Checkmark';

const Notification: React.FC<NotificationProps> = ({
    title,
    issuerImage,
    issuerName,
    issueDate,
    className,
    notificationType = NotificationTypeEnum.Achievement,
    onClick = () => {},
}) => {
    const [isClaimed, setIsClaimed] = useState<boolean>(false);

    const handleClaim = () => setIsClaimed(!isClaimed);

    const notificationStyles = NotificationTypeStyles[notificationType]; // NotificationTypeEnum['skills']
    const { IconComponent } = notificationStyles;
    const claimButtonStyles = isClaimed
        ? notificationStyles.claimedButtonStyles
        : notificationStyles.unclaimedButtonStyles;

    return (
        <div
            className={`flex justify-center items-center relative w-full rounded-3xl shadow-2xl py-3 bg-white ${className}`}
        >
            <div
                className={`absolute flex items-center justify-center top-2 right-2 h-8 w-8 overflow-hidden rounded-full z-10 ${notificationStyles.iconCircleStyles}`}
            >
                <IconComponent className="h-4/5 text-white" />
            </div>
            <div className="flex flex-col justify-center items-center relative w-11/12">
                <div className="flex flex-row items-center justify-start w-full">
                    <div className="h-12 w-12 max-h-12 max-w-[48px] min-h-[48px] min-w-[48px] overflow-hidden rounded-full">
                        <img
                            src={issuerImage}
                            alt="issuer img"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-left ml-3">
                        <h4 className="font-bold tracking-wide line-clamp-1">{title}</h4>
                        <p
                            className={`font-semibold p-0 m-0 leading-none tracking-wide line-clamp-1 capitalize ${notificationStyles?.textStyles}`}
                        >
                            {notificationType} / lorem ipsum
                        </p>
                        <p className="text-grayscale-600 p-0 m-0 leading-none tracking-wide mt-[1px] line-clamp-1">
                            Issued by {issuerName} • {issueDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full mt-3">
                    <button
                        onClick={onClick}
                        type="button"
                        className={`flex-1 rounded-[24px] border-solid border-2 bg-white font-semibold mr-2 py-2 px-3 tracking-wide ${notificationStyles?.viewButtonStyles}`}
                    >
                        View
                    </button>
                    <button
                        type="button"
                        className={`flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide ${claimButtonStyles}`}
                        onClick={handleClaim}
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
