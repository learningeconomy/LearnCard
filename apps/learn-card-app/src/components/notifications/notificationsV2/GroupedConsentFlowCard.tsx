import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline, syncOutline } from 'ionicons/icons';

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

    const summary = useMemo(() => {
        if (count === 1) return `Shared credentials with ${contractName}`;
        return `Shared credentials with ${contractName} · ${count} updates`;
    }, [count, contractName]);

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
                className="flex items-start gap-3 w-full max-w-[600px] p-4 my-2 rounded-[20px] border border-grayscale-200 bg-white hover:bg-grayscale-10 transition-colors cursor-pointer"
            >
                <div className="relative shrink-0">
                    <div className="w-[44px] h-[44px] overflow-hidden rounded-full">
                        <UserProfilePicture
                            user={profile ?? primary?.from}
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-sm"
                        />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-grayscale-100 border border-white">
                        <IonIcon icon={syncOutline} className="text-grayscale-600 text-[12px]" />
                    </span>
                </div>

                <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-poppins font-semibold text-sm text-grayscale-900 truncate">
                            {actorName}
                        </h4>
                        {hasUnread && (
                            <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                    </div>

                    <p className="text-sm text-grayscale-600 leading-relaxed">{summary}</p>
                    <p className="text-xs text-grayscale-400">Latest {latestDate}</p>

                    {count > 1 && (
                        <button
                            onClick={event => {
                                event.stopPropagation();
                                handleToggle();
                            }}
                            className="flex items-center gap-1 mt-1 text-xs font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
                        >
                            {expanded ? 'Hide updates' : `Show ${count} updates`}
                            <IonIcon
                                icon={expanded ? chevronUpOutline : chevronDownOutline}
                                className="text-[14px]"
                            />
                        </button>
                    )}

                    {expanded && count > 1 && (
                        <ul className="mt-2 flex flex-col gap-1.5 border-l border-grayscale-200 pl-3">
                            {notifications.map(notification => (
                                <li
                                    key={notification?._id}
                                    className="flex items-center justify-between gap-2 text-xs"
                                >
                                    <span className="text-grayscale-700">
                                        {getActionLabel(notification)}
                                    </span>
                                    <span className="text-grayscale-400">
                                        {moment(getTransactionDate(notification)).format(
                                            'MMM D, YYYY'
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                        <button
                            onClick={handleView}
                            className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            View
                        </button>
                        <button
                            onClick={handleArchiveGroup}
                            aria-label="Archive"
                            className="flex items-center justify-center h-[38px] w-[38px] rounded-full border border-grayscale-200 bg-white hover:bg-grayscale-10 transition-colors"
                        >
                            <X className="text-grayscale-700 w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default GroupedConsentFlowCard;
