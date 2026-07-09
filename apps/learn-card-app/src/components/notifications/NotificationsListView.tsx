import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { getLogger } from 'learn-card-base';

import NewNotificationsList from './notificationsV2/NewNotificationsList';

import {
    DEFAULT_ACTIVE_OPTIONS,
    DEFAULT_ACTIVE_FILTER,
    DEFAULT_ARCHIVE_OPTIONS,
    DEFAULT_ARCHIVE_FILTER,
    getNotificationsEndpoint,
    useWallet,
    useMarkAllNotificationsRead,
} from 'learn-card-base';

const log = getLogger('notifications-list-view');

/**
 * Shared notifications list body. Renders the active/archived notifications for
 * the current tab and handles the notifications-webhook check plus the
 * mark-all-read-on-leave behavior.
 *
 * Used both by the full-page `/notifications` route (mobile) and by the desktop
 * right-side notifications modal (LC — desktop alerts modal), so the two entry
 * points stay in sync.
 */
export const NotificationsListView: React.FC<{
    isEmptyState: boolean;
    setIsEmptyState: React.Dispatch<React.SetStateAction<boolean>>;
    tab: string;
}> = ({ isEmptyState, setIsEmptyState, tab }) => {
    const location = useLocation();
    const { initWallet } = useWallet();

    const { mutate: markAllNotificationsRead } = useMarkAllNotificationsRead();

    const checkUserNotificationsEndpoint = async () => {
        // Check a users' profile to see if their notifications webhook endpoint is set
        // If not, then attempt to update the user's notifications webhook endpoint value
        try {
            const wallet = await initWallet();
            const myProfile = await wallet.invoke.getProfile();

            if (
                !myProfile?.notificationsWebhook ||
                myProfile?.notificationsWebhook?.trim?.() === ''
            ) {
                const notificationsEndpoint = getNotificationsEndpoint();
                await wallet.invoke.updateProfile({
                    notificationsWebhook: notificationsEndpoint,
                });
            }
        } catch (e) {
            log.warn('Error checking user notifications endpoint', e);
        }
    };

    const clearBadgeCount = async () => {
        await Badge?.clear?.();
    };

    const handleMarkAllRead = async () => {
        // Mark notifications read on LCA API
        await markAllNotificationsRead();
        if (Capacitor.isNativePlatform()) {
            // Clear badge count on native as well
            clearBadgeCount();
        }
    };

    useEffect(() => {
        checkUserNotificationsEndpoint();
        if (Capacitor?.isNativePlatform()) {
            // Clear badge count on native as well
            clearBadgeCount();
        }
    }, []);

    useEffect(() => {
        return () => {
            handleMarkAllRead();
        };
    }, [location]);

    return (
        <section className="w-full h-full min-w-[300px] bg-white pb-7">
            {tab === 'active' && (
                <NewNotificationsList
                    options={DEFAULT_ACTIVE_OPTIONS}
                    filter={DEFAULT_ACTIVE_FILTER}
                    isEmptyState={isEmptyState}
                    setIsEmptyState={setIsEmptyState}
                />
            )}

            {tab === 'archived' && (
                <NewNotificationsList
                    options={DEFAULT_ARCHIVE_OPTIONS}
                    filter={DEFAULT_ARCHIVE_FILTER}
                    isEmptyState={isEmptyState}
                    setIsEmptyState={setIsEmptyState}
                />
            )}
        </section>
    );
};

export default NotificationsListView;
