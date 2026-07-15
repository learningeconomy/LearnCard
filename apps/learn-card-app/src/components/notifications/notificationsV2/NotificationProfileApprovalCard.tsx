import React from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { UserProfilePicture } from 'learn-card-base';
import { notificationCardStyles } from './types';

type NotificationProfileApprovalCardProps = {
    notification: NotificationType;
    onRead?: () => void;
};

const NotificationProfileApprovalCard: React.FC<NotificationProfileApprovalCardProps> = ({
    notification,
    onRead,
}) => {
    const transactionDate = notification.sent;
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const handleMarkRead = async () => {
        await onRead?.();
    };

    return (
        <ErrorBoundary
            fallback={
                <div className={notificationCardStyles.fallbackShell}>
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleMarkRead}
                className={`${notificationCardStyles.shell} min-h-[120px] gap-3 !items-center`}
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <UserProfilePicture
                        user={notification.from}
                        customContainerClass="h-[60px] w-[60px] rounded-full text-white"
                        customImageClass="h-[60px] w-[60px]"
                        customSize={120}
                    />
                </div>

                <div className="text-left flex flex-col gap-[10px] items-start justify-start w-full">
                    <h4
                        className={`cursor-pointer ${notificationCardStyles.title}`}
                        data-testid="notification-title"
                    >
                        {notification.message?.title}
                    </h4>
                    <p
                        className={`${notificationCardStyles.meta} text-indigo-600`}
                        data-testid="notification-type"
                    >
                        Account Approval{' '}
                        {transactionDate && (
                            <span
                                className={notificationCardStyles.date}
                                data-testid="notification-cred-issue-date"
                            >
                                • {formattedDate}
                            </span>
                        )}
                    </p>
                    <p className={notificationCardStyles.body}>{notification.message?.body}</p>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationProfileApprovalCard;
