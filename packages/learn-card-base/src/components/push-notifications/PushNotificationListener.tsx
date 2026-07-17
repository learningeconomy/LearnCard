import { useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PushNotificationSchema } from '@capacitor/push-notifications';

import { useWallet, useToast, ToastTypeEnum, useIsLoggedIn } from 'learn-card-base';

import { pushUtilities } from '../../utils/pushUtilities';
import {
    parseForegroundPushNotification,
    resolveNotificationRoute,
    getNotificationToastCopy,
    getNotificationSenderImage,
    shouldToastNotification,
} from '../../helpers/pushNotificationHelpers';
import { PushNotificationToast } from './PushNotificationToast';

const FOREGROUND_TOAST_DURATION_MS = 6000;

export const PushNotificationListener = () => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const history = useHistory();
    const queryClient = useQueryClient();

    const { presentToast, dismissToast } = useToast();

    const handleNotificationRegistrationError = (text: string) => {
        presentToast(text, {
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
        });
    };

    const handleForegroundNotification = useCallback(
        (payload: PushNotificationSchema) => {
            const notification = parseForegroundPushNotification(payload);

            if (!notification) return;

            queryClient.invalidateQueries({ queryKey: ['useGetUnreadUserNotifications'] });
            queryClient.invalidateQueries({ queryKey: ['useGetUserNotifications'] });

            if (!shouldToastNotification(notification)) return;

            const { title, body } = getNotificationToastCopy(notification);
            const path = resolveNotificationRoute(notification);
            const imageUrl = getNotificationSenderImage(notification);

            presentToast(
                <PushNotificationToast
                    title={title}
                    body={body}
                    imageUrl={imageUrl}
                    onClick={() => {
                        history.push(path);
                        dismissToast();
                    }}
                />,
                { autoDismiss: true, duration: FOREGROUND_TOAST_DURATION_MS }
            );
        },
        [queryClient, presentToast, dismissToast, history]
    );

    useEffect(() => {
        pushUtilities.addBackgroundPushNotificationListeners(
            initWallet,
            history,
            isLoggedIn,
            handleNotificationRegistrationError,
            handleForegroundNotification
        );
    }, [history, isLoggedIn, handleForegroundNotification]);

    return null;
};
