import React, { useState, useEffect, useCallback } from 'react';
import { X, Inbox, Award, Bell, ExternalLink } from 'lucide-react';
import moment from 'moment';

import { useWallet } from 'learn-card-base';

import { VC } from '@learncard/types';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import CredentialCard from './CredentialCard';
import AiSessionCard, { isAiSessionSummaryRecord } from './AiSessionCard';
import AiTopicCard, { isAiTopicRecord } from './AiTopicCard';
import { CredentialRecord } from './AppCredentialDashboard';

type PanelTab = 'credentials' | 'notifications';

const LoadingSkeletons: React.FC = () => (
    <div className="space-y-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
    icon,
    title,
    description,
}) => (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
    </div>
);

interface NotificationPanelCardProps {
    notification: NotificationType;
    onOpen?: (notificationId: string, actionPath?: string) => void;
    onClear?: (notificationId: string) => void;
}

const NotificationPanelCard: React.FC<NotificationPanelCardProps> = ({
    notification,
    onOpen,
    onClear,
}) => {
    const title = notification.message?.title;
    const body = notification.message?.body;
    const isUnread = !notification.read;

    const metadata = notification.data?.metadata as Record<string, unknown> | undefined;
    const category = metadata?.category as string | undefined;
    const priority = metadata?.priority as string | undefined;
    const actionPath = metadata?.actionPath as string | undefined;

    const formattedDate = notification.sent
        ? moment(notification.sent).format('MMM D, YYYY h:mma')
        : undefined;

    const isHighPriority = priority === 'high';
    const bgColor = isHighPriority ? 'bg-orange-50' : 'bg-sky-50';
    const iconBgColor = isHighPriority ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600';
    const hasAction = !!actionPath;

    const handleClick = () => {
        if (notification._id) {
            onOpen?.(notification._id, actionPath);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (notification._id) {
            onClear?.(notification._id);
        }
    };

    return (
        <div
            onClick={hasAction ? handleClick : undefined}
            className={`flex gap-3 items-center w-full rounded-3xl py-[15px] px-[15px] ${bgColor} ${
                hasAction ? 'cursor-pointer hover:opacity-90' : ''
            } transition-opacity relative`}
        >
            {isUnread && (
                <div className="notification-count-mobile unread-indicator-dot" />
            )}

            {/* Bell icon */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${iconBgColor}`}>
                <Bell className="w-7 h-7" />
            </div>

            {/* Content */}
            <div className="text-left flex flex-col gap-[4px] items-start justify-start flex-1 min-w-0">
                {title && (
                    <h4 className="font-bold tracking-wide line-clamp-2 text-gray-900 text-[14px] pr-[20px]">
                        {title}
                    </h4>
                )}

                {body && (
                    <p className="text-gray-600 text-[13px] line-clamp-2">{body}</p>
                )}

                <div className="flex items-center gap-2 mt-1">
                    <p className="font-semibold p-0 leading-none tracking-wide line-clamp-1 text-[12px] text-gray-500">
                        {category && (
                            <span className="capitalize">{category}</span>
                        )}

                        {priority && (
                            <span className={`ml-1 ${isHighPriority ? 'text-red-500' : 'text-gray-400'} font-normal capitalize`}>
                                {category ? '\u00b7 ' : ''}{priority}
                            </span>
                        )}

                        {formattedDate && (
                            <span className="text-gray-400 normal-case font-normal text-[12px] ml-1">
                                &middot; {formattedDate}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {hasAction && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-gray-700 font-semibold text-[13px] border border-gray-200 transition-colors"
                    >
                        Open
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                )}

                <button
                    onClick={handleClear}
                    className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export interface CredentialPanelContentProps {
    appId: string;
    appName: string;
    listingId?: string;
    onClose: () => void;
    initialNewUris?: Set<string>;
    initialTab?: PanelTab;
    onNavigateAction?: (actionPath: string) => void;
}

const CredentialPanelContent: React.FC<CredentialPanelContentProps> = ({
    appId,
    appName,
    listingId,
    onClose,
    initialNewUris = new Set(),
    initialTab = 'credentials',
    onNavigateAction,
}) => {
    const { initWallet } = useWallet();

    const [activeTab, setActiveTab] = useState<PanelTab>(initialTab);

    const [isLoading, setIsLoading] = useState(true);
    const [earnedCredentials, setEarnedCredentials] = useState<CredentialRecord[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);
    const [sessionNewUris] = useState<Set<string>>(initialNewUris);

    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);

    const fetchCredentials = useCallback(async () => {
        if (!appId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const wallet = await initWallet();
            if (!wallet) return;

            const result = await wallet.invoke.getMyCredentialsFromApp(appId, { limit: 50 });

            const appCredentials: CredentialRecord[] = [];

            for (const record of result.records) {
                try {
                    const vc = await wallet.read.get(record.credentialUri);
                    appCredentials.push({
                        uri: record.credentialUri,
                        credential: vc as VC | undefined,
                        dateEarned: new Date(record.date),
                        status: record.status,
                        isNew: sessionNewUris.has(record.credentialUri),
                        boostName: record.boostName,
                        boostCategory: record.boostCategory,
                    });
                } catch {
                    appCredentials.push({
                        uri: record.credentialUri,
                        dateEarned: new Date(record.date),
                        status: record.status,
                        isNew: sessionNewUris.has(record.credentialUri),
                        boostName: record.boostName,
                        boostCategory: record.boostCategory,
                    });
                }
            }
            setEarnedCredentials(appCredentials);
            setBadgeCount(result.totalCount);
        } catch (error) {
            console.error('[CredentialPanelContent] Error fetching credentials:', error);
        } finally {
            setIsLoading(false);
        }
    }, [appId, sessionNewUris]);

    const fetchNotifications = useCallback(async () => {
        if (!listingId) return;

        setIsLoadingNotifications(true);
        try {
            const wallet = await initWallet();
            if (!wallet) return;

            const result = await wallet.invoke.queryNotifications(
                { 'data.metadata.listingId': listingId, archived: false },
                { limit: 50 }
            );

            if (result) {
                setNotifications(result.notifications);
            }
        } catch (error) {
            console.error('[CredentialPanelContent] Error fetching notifications:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, [listingId, initWallet]);

    // Fetch on mount
    useEffect(() => {
        fetchCredentials();
    }, [fetchCredentials]);

    useEffect(() => {
        if (listingId) {
            fetchNotifications();
        }
    }, [listingId, fetchNotifications]);

    // Handle ESC key to close panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleClearNotification = useCallback(async (notificationId: string) => {
        try {
            const wallet = await initWallet();
            if (!wallet) return;

            await wallet.invoke.updateNotificationMeta(notificationId, { archived: true });

            setNotifications(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('[CredentialPanelContent] Error archiving notification:', error);
        }
    }, [initWallet]);

    const handleOpenNotification = useCallback(async (notificationId: string, actionPath?: string) => {
        try {
            const wallet = await initWallet();

            if (wallet) {
                await wallet.invoke.updateNotificationMeta(notificationId, { read: true });

                setNotifications(prev =>
                    prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
                );
            }
        } catch (error) {
            console.error('[CredentialPanelContent] Error marking notification read:', error);
        }

        if (actionPath && onNavigateAction) {
            onNavigateAction(actionPath);
        }

        onClose();
    }, [onClose, onNavigateAction, initWallet]);

    const unreadNotificationCount = notifications.filter(n => !n.read).length;

    const showTabs = listingId !== undefined;

    return (
        <div className="flex flex-col h-full bg-white safe-area-top-margin">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
                <div>
                    <h2 className="text-lg font-semibold text-white">Activity from {appName}</h2>
                    <p className="text-sm text-white/80">
                        {badgeCount} credential{badgeCount !== 1 ? 's' : ''}
                        {unreadNotificationCount > 0 && (
                            <> &middot; {unreadNotificationCount} unread notification{unreadNotificationCount !== 1 ? 's' : ''}</>
                        )}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                    aria-label="Close panel"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            {showTabs && (
                <div className="flex border-b border-gray-200 bg-white">
                    <button
                        onClick={() => setActiveTab('credentials')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'credentials'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Award className="w-4 h-4" />
                        Credentials
                        {badgeCount > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {badgeCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'notifications'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Bell className="w-4 h-4" />
                        Notifications
                        {unreadNotificationCount > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {unreadNotificationCount}
                            </span>
                        )}
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {activeTab === 'credentials' && (
                    <>
                        {isLoading && earnedCredentials.length === 0 ? (
                            <LoadingSkeletons />
                        ) : earnedCredentials.length === 0 ? (
                            <EmptyState
                                icon={<Inbox className="w-12 h-12 text-indigo-400" />}
                                title="No credentials earned yet"
                                description={`Keep exploring ${appName}! Credentials you earn will appear here.`}
                            />
                        ) : (
                            <div className="space-y-4">
                                {earnedCredentials.map((record, index) => {
                                    if (isAiSessionSummaryRecord(record)) {
                                        return (
                                            <AiSessionCard
                                                key={record.uri}
                                                record={record}
                                                isNew={record.isNew}
                                                index={index}
                                            />
                                        );
                                    }

                                    if (isAiTopicRecord(record)) {
                                        return (
                                            <AiTopicCard
                                                key={record.uri}
                                                record={record}
                                                isNew={record.isNew}
                                                index={index}
                                            />
                                        );
                                    }

                                    return (
                                        <CredentialCard
                                            key={record.uri}
                                            record={record}
                                            isNew={record.isNew}
                                            index={index}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'notifications' && (
                    <>
                        {isLoadingNotifications && notifications.length === 0 ? (
                            <LoadingSkeletons />
                        ) : notifications.length === 0 ? (
                            <EmptyState
                                icon={<Bell className="w-12 h-12 text-amber-400" />}
                                title="No notifications yet"
                                description={`Notifications from ${appName} will appear here.`}
                            />
                        ) : (
                            <div className="space-y-[15px]">
                                {notifications.map(notification => (
                                    <NotificationPanelCard
                                        key={notification._id}
                                        notification={notification}
                                        onOpen={handleOpenNotification}
                                        onClear={handleClearNotification}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CredentialPanelContent;
