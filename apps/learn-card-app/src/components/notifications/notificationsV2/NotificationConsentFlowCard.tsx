import React from 'react';
import moment from 'moment';

import AiInsightsNotification from '../../../pages/ai-insights/notifications/AiInsightsNotification';

import { ErrorBoundary } from '@sentry/react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { NotificationTypeEnum, NotificationTypeStyles } from './types';
import { NotificationType } from 'packages/plugins/lca-api-plugin/dist';

type NotificationConsentFlowCardProps = {
    notification: NotificationType;
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
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const isLoading = false;

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
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full rounded-3xl shadow-bottom py-[10px] px-[10px] bg-white my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                // onClick={handleMarkRead}
                // ref={ref}
                className="flex gap-3 min-h-[120px] justify-start items-center max-w-[600px] relative w-full rounded-3xl shadow-bottom py-[10px] px-[10px] bg-white my-[15px]"
            >
                {/* {!isRead && !isLoading && (
                        <div className="notification-count-mobile unread-indicator-dot" />
                    )} */}
                <div
                    className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0"
                    // onClick={handleCardClick}
                >
                    {!isLoading && (
                        <img
                            src={notification.from.image}
                            className="h-[60px] w-[60px] rounded-full"
                        />
                    )}

                    {isLoading && <div className="w-[90px] h-[90px] rounded-full bg-gray-50" />}
                </div>

                <div className="text-left flex flex-col gap-[10px] items-start justify-start w-full">
                    <h4
                        // onClick={handleCardClick}
                        className="cursor-pointer font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        {notification.message?.title}
                    </h4>
                    <p
                        className={`font-semibold p-0 leading-none tracking-wide line-clamp-1 text-[12px] notification-card-type-text ${textStyles}`}
                        data-testid="notification-type"
                    >
                        {typeText}{' '}
                        {transactionDate && (
                            <span
                                className="text-grayscale-600 normal-case font-normal text-[12px] notification-card-type-issue-date"
                                data-testid="notification-cred-issue-date"
                            >
                                • {formattedDate}
                            </span>
                        )}
                    </p>
                    <p>{notification.message?.body}</p>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationConsentFlowCard;
