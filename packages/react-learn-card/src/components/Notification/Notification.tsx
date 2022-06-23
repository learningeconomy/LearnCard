import React from 'react';

import { NotificationProps, NotificationTypeEnum, NotificationTypeStyles } from './types';

const Notification: React.FC<NotificationProps> = ({
    title,
    issuerImage,
    issuerName,
    issueDate,
    className,
}) => {
    const notificationStyles = NotificationTypeStyles[NotificationTypeEnum.Achievements]; // NotificationTypeEnum['skills']

    return (
        <div className="flex justify-center items-center relative w-full rounded-3xl shadow-2xl py-3 bg-white">
            <div
                className={`absolute flex items-center justify-center top-2 right-2 h-8 w-8 overflow-hidden rounded-full z-10 ${notificationStyles.iconCircleStyles}`}
            >
                <img src={notificationStyles?.icon} alt="status icon" className="h-4/5" />
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
                        <h4 className="font-bold tracking-wide line-clamp-1">
                            Title of Credential
                        </h4>
                        <p
                            className={`font-semibold p-0 m-0 leading-none tracking-wide line-clamp-1 ${notificationStyles?.textStyles}`}
                        >
                            Achievement / Achievment Type
                        </p>
                        <p className="text-grayscale-600 p-0 m-0 leading-none tracking-wide mt-[1px] line-clamp-1">
                            Issued by Issuer Name • 04 Apr 22
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full mt-3">
                    <button
                        type="button"
                        className={`flex-1 rounded-[24px] border-solid border-2 bg-white font-semibold mr-2 py-2 px-3 tracking-wide ${notificationStyles?.viewButtonStyles}`}
                    >
                        View
                    </button>
                    <button
                        type="button"
                        className={`flex-1 rounded-[24px] border-2 text-white border-solid font-semibold py-2 px-3 tracking-wide ${notificationStyles?.claimButtonStyles}`}
                    >
                        Claim
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notification;
