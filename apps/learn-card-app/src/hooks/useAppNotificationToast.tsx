import React, { useState, useCallback } from 'react';

import AppNotificationToast, {
    type AppNotificationToastData,
} from '../components/notifications/AppNotificationToast';

interface UseAppNotificationToastReturn {
    handleAppNotification: (notification: {
        title?: string;
        body?: string;
        actionPath?: string;
        category?: string;
        priority?: string;
    }) => void;

    ToastOverlay: React.ReactElement;
}

/**
 * Extracts the duplicated app-notification toast state + callback pattern
 * used by EmbedIframeModal and EmbedAppFullScreen into a single reusable hook.
 *
 * Usage:
 * ```ts
 * const { handleAppNotification, ToastOverlay } = useAppNotificationToast(appName);
 * // pass handleAppNotification to useLearnCardMessageHandlers as onAppNotification
 * // render ToastOverlay inside the component tree
 * ```
 */
export const useAppNotificationToast = (
    appName: string,
    options?: { onTapAction?: (actionPath: string) => void }
): UseAppNotificationToastReturn => {
    const [toastNotification, setToastNotification] =
        useState<AppNotificationToastData | null>(null);

    const handleAppNotification = useCallback(
        (notification: {
            title?: string;
            body?: string;
            actionPath?: string;
            category?: string;
            priority?: string;
        }) => {
            setToastNotification({
                ...notification,
                appName,
            });
        },
        [appName]
    );

    const ToastOverlay = (
        <AppNotificationToast
            notification={toastNotification}
            onDismiss={() => setToastNotification(null)}
            onTapAction={options?.onTapAction}
        />
    );

    return { handleAppNotification, ToastOverlay };
};
