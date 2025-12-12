import React from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { ErrorBoundary } from '@sentry/react';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { CheckCircle, XCircle, Send, Store } from 'lucide-react';

type NotificationAppStoreCardProps = {
    notification: NotificationType;
    onRead?: () => void;
    variant: 'approved' | 'rejected' | 'submitted';
};

const VARIANT_CONFIG = {
    approved: {
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        Icon: CheckCircle,
        label: 'App Approved',
    },
    rejected: {
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        Icon: XCircle,
        label: 'Review Required',
    },
    submitted: {
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        Icon: Send,
        label: 'New Submission',
    },
};

const NotificationAppStoreCard: React.FC<NotificationAppStoreCardProps> = ({
    notification,
    onRead,
    variant,
}) => {
    const history = useHistory();
    const transactionDate = notification.sent;
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const config = VARIANT_CONFIG[variant];
    const { Icon, bgColor, iconColor, label } = config;

    const listingId = notification.data?.metadata?.listingId as string | undefined;

    const handleClick = async () => {
        await onRead?.();

        // Navigate to the appropriate page based on variant
        if (variant === 'submitted') {
            // Admin notification - go to admin dashboard
            history.push('/app-store/admin');
        } else if (listingId) {
            // Developer notification - go to developer portal
            history.push('/app-store/developer');
        }
    };

    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full rounded-3xl py-[10px] px-[10px] bg-gray-50 my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleClick}
                className={`flex gap-3 min-h-[100px] justify-start items-center max-w-[600px] relative w-full rounded-3xl py-[15px] px-[15px] ${bgColor} my-[15px] cursor-pointer hover:opacity-90 transition-opacity`}
            >
                {/* Icon */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <div className="text-left flex flex-col gap-[6px] items-start justify-start w-full">
                    <h4
                        className="font-bold tracking-wide line-clamp-2 text-gray-900 text-[14px] pr-[20px]"
                        data-testid="notification-title"
                    >
                        {notification.message?.title}
                    </h4>

                    <p
                        className="font-semibold p-0 leading-none tracking-wide line-clamp-1 text-[12px] text-gray-500"
                        data-testid="notification-type"
                    >
                        <Store className="w-3 h-3 inline-block mr-1" />
                        {label}
                        {transactionDate && (
                            <span className="text-gray-400 normal-case font-normal text-[12px] ml-1">
                                • {formattedDate}
                            </span>
                        )}
                    </p>

                    <p className="text-gray-600 text-[13px] line-clamp-2">
                        {notification.message?.body}
                    </p>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationAppStoreCard;
