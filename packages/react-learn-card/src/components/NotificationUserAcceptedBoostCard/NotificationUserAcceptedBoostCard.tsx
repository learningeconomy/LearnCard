import React, { useState, useEffect } from 'react';
import X from '../../assets/images/X.svg';
import { NotificationUserAcceptedBoostCardProps } from './types';
import { UserNotificationTypeStyles } from '../NotificationUserCard/types';

import { UserNotificationTypeEnum } from '../../constants/notifications';
import ArrowArcLeft from '../../assets/images/ArrowArcLeft.svg';

export const NotificationUserAcceptedBoostCard: React.FC<
    NotificationUserAcceptedBoostCardProps
> = ({
    title,
    customThumbComponent,
    className,
    thumbImage,
    notificationType = UserNotificationTypeEnum.AcceptedBoost,
    issueDate,
    loadingState = false,
    handleCancelClick,
    isArchived,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(loadingState || false);

    useEffect(() => {
        setIsLoading(loadingState);
    }, [loadingState]);

    const { textStyles, viewButtonStyles, typeText } = UserNotificationTypeStyles[notificationType];

    return (
        <div
            className={`flex justify-start max-w-[600px] items-start relative w-full rounded-3xl shadow-bottom py-[10px] px-[10px] bg-white ${className}`}
        >
            <div className="notification-card-left-side px-[0px] flex">
                {!customThumbComponent && (
                    <div
                        className={`overflow-hidden w-[50px] h-[50px] rounded-full flex items-start notification-card-thumbnail`}
                    >
                        <img
                            src={thumbImage}
                            alt="Notification Thumb"
                            className="w-full h-full w-[50px] h-[50px] object-cover"
                        />
                    </div>
                )}
                {customThumbComponent && { customThumbComponent }}
            </div>
            <div className="flex flex-col justify-center items-start relative w-full">
                <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                    <h4
                        className="font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        {title}
                    </h4>
                    <p
                        className={`font-semibold p-0 mt-[10px] leading-none tracking-wide line-clamp-1 text-[12px] notification-card-type-text ${textStyles}`}
                        data-testid="notification-type"
                    >
                        {typeText}{' '}
                        {issueDate && (
                            <span
                                className="text-grayscale-600 normal-case font-normal text-[12px] notification-card-type-issue-date"
                                data-testid="notification-cred-issue-date"
                            >
                                {typeText && '•'} {issueDate}
                            </span>
                        )}
                    </p>

                    <div className="flex items-center justify-end w-full mt-3">
                        <button
                            onClick={handleCancelClick}
                            className={`rounded-[24px] flex items-center justify-center  h-[42px] w-[42px] shadow-bottom bg-white font-semibold mr-2 p-[0px] tracking-wide ${viewButtonStyles}`}
                            role="button"
                            name="notification-view-button"
                        >
                            {!isArchived && (
                                <img src={X ?? ''} alt="Cancel" className="notification-card-x" />
                            )}
                            {isArchived && (
                                <img
                                    src={ArrowArcLeft ?? ''}
                                    alt="Cancel"
                                    className="notification-card-x"
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationUserAcceptedBoostCard;
