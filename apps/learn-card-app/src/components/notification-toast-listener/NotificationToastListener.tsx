import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import {
    useGetUnreadUserNotifications,
    useToast,
    useIsLoggedIn,
    getNotificationToastCopy,
    getNotificationSenderImage,
    PushNotificationToast,
} from 'learn-card-base';

import useOpenNotifications from '../notifications/useOpenNotifications';

const POLL_INTERVAL_MS = 30_000;
const TOAST_DURATION_MS = 6000;

// Native builds surface foreground events via PushNotificationListener, so this
// listener only toasts on web — where there is no push channel at all. It still
// polls everywhere to keep the Alerts badge fresh from the same source.
const NotificationToastListener: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
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

        currentIds.forEach(id => seenIds.add(id));

        if (Capacitor.isNativePlatform()) return;

        const newest = freshNotifications[0];
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

    useEffect(() => {
        if (!isLoggedIn) seenIdsRef.current = null;
    }, [isLoggedIn]);

    return null;
};

export default NotificationToastListener;
