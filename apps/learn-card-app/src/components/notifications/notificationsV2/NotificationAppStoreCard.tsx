import React from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { ErrorBoundary } from '@sentry/react';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { CheckCircle, XCircle, Send, Store } from 'lucide-react';
import { notificationCardStyles } from './types';

type NotificationAppStoreCardProps = {
    notification: NotificationType;
    onRead?: () => void;
    variant: 'approved' | 'rejected' | 'submitted';
};

const VARIANT_CONFIG = {
    approved: {
        chipColor: 'bg-emerald-50 text-emerald-600',
        labelColor: 'text-emerald-600',
        Icon: CheckCircle,
        label: 'App Approved',
    },
    rejected: {
        chipColor: 'bg-amber-50 text-amber-600',
        labelColor: 'text-amber-600',
        Icon: XCircle,
        label: 'Review Required',
    },
    submitted: {
        chipColor: 'bg-indigo-50 text-indigo-600',
        labelColor: 'text-indigo-600',
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
    const { Icon, chipColor, labelColor, label } = config;

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
                <div className={notificationCardStyles.fallbackShell}>
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleClick}
                className={`${notificationCardStyles.shell} min-h-[100px] gap-3 !items-center cursor-pointer`}
            >
                {/* Icon */}
                <div className={`${notificationCardStyles.iconChip} ${chipColor}`}>
                    <Icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <div className="text-left flex flex-col gap-[6px] items-start justify-start w-full">
                    <h4 className={notificationCardStyles.title} data-testid="notification-title">
                        {notification.message?.title}
                    </h4>

                    <p
                        className={`${notificationCardStyles.meta} ${labelColor}`}
                        data-testid="notification-type"
                    >
                        <Store className="w-3 h-3 inline-block mr-1" />
                        {label}
                        {transactionDate && (
                            <span className={`${notificationCardStyles.date} ml-1`}>
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

export default NotificationAppStoreCard;
