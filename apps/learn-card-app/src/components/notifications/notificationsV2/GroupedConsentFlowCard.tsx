import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
    chevronDownOutline,
    chevronUpOutline,
    syncOutline,
    checkmarkCircleOutline,
    closeCircleOutline,
    documentTextOutline,
} from 'ionicons/icons';

import { ErrorBoundary } from '@sentry/react';
import X from 'learn-card-base/svgs/X';
import { UserProfilePicture, useGetProfile, useUpdateNotification } from 'learn-card-base';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { parseContractName } from './consentFlowGrouping';

const MANAGE_CONTRACTS_ROUTE = '/admin-tools/manage-contracts';

type GroupedConsentFlowCardProps = {
    notifications: NotificationType[];
};

const getTransactionDate = (notification: NotificationType): string =>
    (notification?.data as any)?.transaction?.date ?? notification?.sent;

const getActionLabel = (notification: NotificationType): string => {
    const body = notification?.message?.body ?? '';
    if (/has synced/i.test(body)) return 'Shared credentials';
    if (/reconsented/i.test(body)) return 'Reconnected';
    if (/consented/i.test(body)) return 'Connected';
    if (/updated their terms/i.test(body)) return 'Updated sharing';
    if (/withdrawn/i.test(body)) return 'Stopped sharing';
    return 'Update';
};

type Bucket = {
    dateStr: string;
    actions: Record<string, number>;
};

const bucketNotifications = (notifications: NotificationType[]): Bucket[] => {
    const buckets: Record<string, Bucket> = {};
    const order: string[] = [];

    for (const notification of notifications) {
        const date = moment(getTransactionDate(notification)).format('MMM D, YYYY');
        const action = getActionLabel(notification);

        if (!buckets[date]) {
            buckets[date] = { dateStr: date, actions: {} };
            order.push(date);
        }

        buckets[date].actions[action] = (buckets[date].actions[action] || 0) + 1;
    }

    return order.map(date => buckets[date]);
};

const getActionIconAndColor = (actions: string[]) => {
    if (actions.some(a => a === 'Stopped sharing')) {
        return { icon: closeCircleOutline, colorClass: 'text-red-500' };
    }
    if (actions.some(a => a === 'Connected' || a === 'Reconnected')) {
        return { icon: checkmarkCircleOutline, colorClass: 'text-emerald-500' };
    }
    if (actions.some(a => a === 'Shared credentials' || a === 'Updated sharing')) {
        return { icon: syncOutline, colorClass: 'text-grayscale-500' };
    }
    return { icon: documentTextOutline, colorClass: 'text-grayscale-500' };
};

const formatActionsText = (actionsMap: Record<string, number>) => {
    return Object.entries(actionsMap)
        .map(([action, count]) => (count > 1 ? `${action} ×${count}` : action))
        .join(' · ');
};

const GroupedConsentFlowCard: React.FC<GroupedConsentFlowCardProps> = ({ notifications }) => {
    const history = useHistory();
    const { mutateAsync: updateNotification } = useUpdateNotification();

    const [expanded, setExpanded] = useState(false);

    const primary = notifications[0];
    const { data: profile } = useGetProfile(primary?.from?.profileId);

    const actorName = profile?.displayName || primary?.from?.displayName || 'Someone';
    const contractName = parseContractName(primary?.message?.body) || 'your contract';
    const count = notifications.length;
    const hasUnread = notifications.some(notification => !notification?.read);
    const latestDate = moment(getTransactionDate(primary)).format('MMM D, YYYY');

    const bucketedNotifications = useMemo(
        () => bucketNotifications(notifications),
        [notifications]
    );

    const markGroupRead = async () => {
        await Promise.all(
            notifications
                .filter(notification => notification?._id && !notification.read)
                .map(notification =>
                    updateNotification({
                        notificationId: notification._id as string,
                        payload: { read: true },
                    })
                )
        );
    };

    const handleArchiveGroup = async (event: React.MouseEvent) => {
        event.stopPropagation();
        await Promise.all(
            notifications
                .filter(notification => notification?._id)
                .map(notification =>
                    updateNotification({
                        notificationId: notification._id as string,
                        payload: { archived: true, read: true },
                    })
                )
        );
    };

    const handleView = (event: React.MouseEvent) => {
        event.stopPropagation();
        markGroupRead();
        history.push(MANAGE_CONTRACTS_ROUTE);
    };

    const handleToggle = () => {
        if (count > 1) setExpanded(prev => !prev);
        markGroupRead();
    };

    return (
        <ErrorBoundary
            fallback={
                <div className="flex w-full max-w-[600px] items-start p-4 my-2 bg-white">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleToggle}
                className="flex flex-col w-full max-w-[600px] p-4 my-2 rounded-[20px] border border-grayscale-200 bg-white hover:bg-grayscale-10 transition-colors cursor-pointer"
            >
                <div className="flex items-start justify-between gap-3 w-full">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-[44px] h-[44px] overflow-hidden rounded-full">
                                <UserProfilePicture
                                    user={profile ?? primary?.from}
                                    customImageClass="w-full h-full object-cover"
                                    customContainerClass="flex items-center justify-center h-full text-white font-medium text-sm"
                                />
                            </div>
                            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-grayscale-100 border border-white">
                                <IonIcon
                                    icon={syncOutline}
                                    className="text-grayscale-600 text-[12px]"
                                />
                            </span>
                        </div>

                        <div className="flex flex-col min-w-0 gap-0.5 mt-0.5">
                            <div className="flex items-center gap-2">
                                <h4 className="font-poppins font-semibold text-sm text-grayscale-900 truncate">
                                    {actorName}
                                </h4>
                                {hasUnread && (
                                    <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                                )}
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mt-0.5">
                                <p className="text-sm text-grayscale-600 truncate">
                                    Shared credentials with {contractName}
                                </p>
                                {count > 1 && (
                                    <button
                                        onClick={event => {
                                            event.stopPropagation();
                                            handleToggle();
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-grayscale-100 hover:bg-grayscale-200 transition-colors text-xs font-medium text-grayscale-700"
                                    >
                                        {count} updates
                                        <IonIcon
                                            icon={expanded ? chevronUpOutline : chevronDownOutline}
                                            className="text-[12px]"
                                        />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-grayscale-400 mt-0.5">Latest {latestDate}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleView}
                            className="py-1.5 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-xs hover:bg-grayscale-100 transition-colors"
                        >
                            View
                        </button>
                        <button
                            onClick={handleArchiveGroup}
                            aria-label="Archive"
                            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-grayscale-100 transition-colors"
                        >
                            <X className="text-grayscale-500 w-4 h-4" />
                        </button>
                    </div>
                </div>

                {expanded && count > 1 && (
                    <div
                        className="mt-4 pt-4 border-t border-grayscale-200 transition-opacity duration-300 ease-in-out opacity-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="max-h-[260px] overflow-y-auto pr-2 relative">
                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-grayscale-200" />

                            <div className="flex flex-col gap-4">
                                {bucketedNotifications.map(bucket => {
                                    const { icon, colorClass } = getActionIconAndColor(
                                        Object.keys(bucket.actions)
                                    );
                                    return (
                                        <div
                                            key={bucket.dateStr}
                                            className="flex items-start gap-3 relative z-10"
                                        >
                                            <div className="shrink-0 w-[22px] h-[22px] rounded-full bg-white border border-grayscale-200 flex items-center justify-center mt-0.5">
                                                <IonIcon
                                                    icon={icon}
                                                    className={`text-[12px] ${colorClass}`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                                                <span className="text-sm text-grayscale-700 leading-snug">
                                                    {formatActionsText(bucket.actions)}
                                                </span>
                                                <span className="text-xs text-grayscale-400 shrink-0 mt-0.5">
                                                    {bucket.dateStr}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default GroupedConsentFlowCard;
