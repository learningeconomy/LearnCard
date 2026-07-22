import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import {
    useGetUnreadUserNotifications,
    useToast,
    useIsLoggedIn,
    getNotificationToastCopy,
    getNotificationSenderImage,
    shouldToastNotification,
    PushNotificationToast,
    switchedProfileStore,
} from 'learn-card-base';

import useOpenNotifications from '../notifications/useOpenNotifications';

const POLL_INTERVAL_MS = 30_000;
const TOAST_DURATION_MS = 6000;

// Native builds surface foreground events via PushNotificationListener, so this
// listener only toasts on web — where there is no push channel at all. It still
// polls everywhere to keep the Alerts badge fresh from the same source.
const NotificationToastListener: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const openNotifications = useOpenNotifications();
    const { presentToast, dismissToast } = useToast();

    const { data } = useGetUnreadUserNotifications({
        refetchInterval: POLL_INTERVAL_MS,
        enabled: isLoggedIn,
    });

    const seenIdsRef = useRef<Set<string> | null>(null);

    useEffect(() => {
        if (!data || data === false) return;

        const notifications = data.notifications ?? [];
        const currentIds = notifications
            .map(notification => notification._id)
            .filter((id): id is string => Boolean(id));

        // First successful load establishes the baseline without toasting the
        // existing backlog.
        if (seenIdsRef.current === null) {
            seenIdsRef.current = new Set(currentIds);
            return;
        }

        const seenIds = seenIdsRef.current;
        const freshNotifications = notifications.filter(
            notification => notification._id && !seenIds.has(notification._id)
        );

        // Rebuild the baseline from the current unread set each cycle so it
        // stays bounded to what's actually unread.
        seenIdsRef.current = new Set(currentIds);

        if (Capacitor.isNativePlatform()) return;

        // Toast only the newest toastable notification per poll; any others
        // still appear in the Alerts list and badge, so nothing is lost.
        const newest = freshNotifications.find(shouldToastNotification);
        if (!newest) return;

        const { title, body } = getNotificationToastCopy(newest);
        const imageUrl = getNotificationSenderImage(newest);

        presentToast(
            <PushNotificationToast
                title={title}
                body={body}
                imageUrl={imageUrl}
                onClick={() => {
                    dismissToast();
                    openNotifications();
                }}
            />,
            { autoDismiss: true, duration: TOAST_DURATION_MS }
        );
    }, [data, presentToast, dismissToast, openNotifications]);

    // Reset the baseline on logout OR profile switch — the unread query is
    // per-DID, so a switched profile must not toast its existing backlog.
    useEffect(() => {
        seenIdsRef.current = null;
    }, [isLoggedIn, switchedDid]);

    return null;
};

export default NotificationToastListener;
