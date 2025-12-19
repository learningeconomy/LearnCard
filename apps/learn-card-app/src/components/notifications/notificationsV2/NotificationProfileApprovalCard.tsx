import React from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { UserProfilePicture } from 'learn-card-base';

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
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full rounded-3xl py-[10px] px-[10px] bg-blue-50 my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleMarkRead}
                className="flex gap-3 min-h-[120px] justify-start items-center max-w-[600px] relative w-full rounded-3xl py-[10px] px-[10px] bg-blue-50 my-[15px]"
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
                        className="cursor-pointer font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        {notification.message?.title}
                    </h4>
                    <p
                        className="font-semibold p-0 leading-none tracking-wide line-clamp-1 text-[12px] text-grayscale-500"
                        data-testid="notification-type"
                    >
                        Account Approval{' '}
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

export default NotificationProfileApprovalCard;
