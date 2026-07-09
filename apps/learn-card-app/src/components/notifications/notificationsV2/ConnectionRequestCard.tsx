import React, { useState, useEffect, useRef } from 'react';

// import X from '../../../assets/images/X.svg';
import X from 'learn-card-base/svgs/X';
import { UserProfilePicture } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import NotificationSkeleton from './NotificationSkeleton';
import ArrowArcLeft from '../../../assets/images/ArrowArcLeft.svg';

import useOnScreen from 'learn-card-base/hooks/useOnScreen';

import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import {
    UserNotificationTypeStyles,
    UserNotificationTypeEnum,
    notificationCardStyles,
} from './types';

type ConnectionRequestCardProps = {
    title: string;
    customThumbComponent?: React.ReactNode;
    className?: string;
    issueDate?: string;
    handleButtonClick?: () => void;
    handleCancelClick: () => void;
    isArchived?: boolean;
    acceptStatus?: boolean;
    isLoading?: boolean;
    notification: NotificationType;
    handleRead?: () => void;
    cardLoading?: boolean;
};

const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({
    title,
    customThumbComponent,
    className,
    issueDate,
    handleButtonClick,
    handleCancelClick,
    isArchived,
    acceptStatus = false,
    isLoading,
    notification,
    handleRead,
    cardLoading,
}) => {
    const [isAccepted, setisAccepted] = useState<boolean>(acceptStatus);
    const [isRead, setisRead] = useState<boolean>(notification?.read);

    // Ref for the element that we want to detect whether on screen
    const ref: any = useRef<HTMLDivElement>();

    const onScreen: boolean = useOnScreen<HTMLDivElement>(ref, '-130px');

    useEffect(() => {
        setisAccepted(acceptStatus);
    }, [acceptStatus]);

    const { textStyles, viewButtonStyles, claimedButtonStyles, unclaimedButtonStyles, typeText } =
        UserNotificationTypeStyles[UserNotificationTypeEnum.ConnectionRequest];

    const claimButtonStyles = isAccepted ? claimedButtonStyles : unclaimedButtonStyles;

    let buttonText: string = '';

    if (isAccepted) {
        buttonText = 'Accepted';
    } else if (!isAccepted) {
        buttonText = 'Accept';
    }

    const handleAcceptConnection = async () => {
        if (!acceptStatus && !isLoading) {
            await handleButtonClick?.();
        }
    };

    const handleReadStatus = async () => {
        if (!isRead) {
            await handleRead?.();
            setisRead(true);
        }
    };

    if (cardLoading) {
        return <NotificationSkeleton />;
    }

    return (
        <div
            onClick={handleReadStatus}
            ref={ref}
            className={`${notificationCardStyles.shell} ${className}`}
        >
            {!isRead && !isLoading && (
                <div className="notification-count-mobile unread-indicator-dot" />
            )}
            <div className="notification-card-left-side px-[0px] flex">
                {!customThumbComponent && (
                    <div
                        className={`overflow-hidden cursor-pointer w-[90px] h-[90px] flex items-start notification-card-thumbnail`}
                    >
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-4xl p-[6px]"
                            customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                            customSize={90}
                            user={notification?.from}
                        />
                    </div>
                )}
                {customThumbComponent && customThumbComponent}
            </div>
            <div className="flex flex-col justify-center items-start relative w-full">
                <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                    <h4
                        className={`cursor-pointer ${notificationCardStyles.title}`}
                        data-testid="notification-title"
                    >
                        {title}
                    </h4>
                    <p
                        className={`${notificationCardStyles.meta} mt-[10px] ${textStyles}`}
                        data-testid="notification-type"
                    >
                        {typeText}{' '}
                        {issueDate && (
                            <span
                                className={notificationCardStyles.date}
                                data-testid="notification-cred-issue-date"
                            >
                                • {issueDate}
                            </span>
                        )}
                    </p>

                    <div className="relative flex items-center justify-between mt-3 w-full">
                        <button
                            className={`${notificationCardStyles.primaryButton} mr-[15px] w-[143px] ${claimButtonStyles}`}
                            onClick={handleAcceptConnection}
                            name="notification-claim-button"
                        >
                            {isLoading ? 'Loading...' : buttonText}
                            {isAccepted && <Checkmark className="h-[24px] p-0 m-0" />}{' '}
                        </button>

                        <button
                            onClick={handleCancelClick}
                            className={`${notificationCardStyles.iconButton} mr-2`}
                            name="notification-view-button"
                        >
                            {!isArchived && (
                                <X className="text-grayscale-700 w-[20px] h-[20px] notification-card-x" />
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

export default ConnectionRequestCard;
