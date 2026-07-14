import React, { useState } from 'react';
import moment from 'moment';

import { ErrorBoundary } from '@sentry/react';
import AiInsightsNotification from '../../../pages/ai-insights/notifications/AiInsightsNotification';

import {
    capitalize,
    CredentialCategoryEnum,
    UserProfilePicture,
    useUpdateNotification,
} from 'learn-card-base';
import { NotificationTypeEnum, NotificationTypeStyles, notificationCardStyles } from './types';

type NotificationConsentFlowCardProps = {
    notification: any;
    claimStatus?: boolean;
    handleArchive?: () => void;
    handleRead?: () => void;
    cardLoading?: boolean;
};

const NotificationConsentFlowCard: React.FC<NotificationConsentFlowCardProps> = ({
    notification,
    claimStatus,
    handleArchive,
    handleRead,
    cardLoading,
}) => {
    const { textStyles, typeText } =
        NotificationTypeStyles[NotificationTypeEnum.consentFlowTransaction];

    const transactionDate = notification.data?.transaction?.date ?? notification.sent;
    const formattedDate = moment(transactionDate).format('MMM DD YYYY');

    const [isRead, setIsRead] = useState<boolean>(notification?.read || false);

    const { mutate: updateNotification } = useUpdateNotification();

    const isLoading = cardLoading;

    const handleReadStatus = async () => {
        setIsRead(true);
        await updateNotification({
            notificationId: notification?._id,
            payload: { read: true },
        });
    };

    const isAiInsightsNotification =
        notification.data?.metadata?.type === CredentialCategoryEnum.aiInsight;

    if (isAiInsightsNotification) {
        return (
            <AiInsightsNotification
                notification={notification}
                claimStatus={claimStatus}
                handleArchive={handleArchive}
                cardLoading={cardLoading}
            />
        );
    }

    return (
        <ErrorBoundary
            fallback={
                <div className={notificationCardStyles.fallbackShell}>
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleReadStatus}
                className={`${notificationCardStyles.shell} min-h-[120px]`}
            >
                {!isRead && !isLoading && (
                    <div className="notification-count-mobile unread-indicator-dot" />
                )}
                <div className="notification-card-left-side px-[0px] flex cursor-pointer">
                    <div className="w-[78px] h-[78px] min-w-[78px] min-h-[78px] max-w-[78px] max-h-[78px] overflow-hidden rounded-full">
                        <UserProfilePicture
                            user={notification.from}
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
                        />
                    </div>

                    {isLoading && (
                        <div className="w-[78px] h-[78px] rounded-full bg-grayscale-50" />
                    )}
                </div>

                <div className="flex flex-col justify-center items-start relative w-full">
                    <div className="text-left ml-3 flex flex-col gap-2 items-start justify-start w-full">
                        <h4
                            className={`cursor-pointer ${notificationCardStyles.title}`}
                            data-testid="notification-title"
                        >
                            {capitalize(notification.message?.title)}
                        </h4>
                        <p className={`${notificationCardStyles.body} w-full`}>
                            {notification.message?.body}
                        </p>
                        <p
                            className={`${notificationCardStyles.meta} text-indigo-600`}
                            data-testid="notification-type"
                        >
                            {typeText}{' '}
                            {transactionDate && (
                                <span
                                    className={notificationCardStyles.date}
                                    data-testid="notification-cred-issue-date"
                                >
                                    • {formattedDate}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationConsentFlowCard;
