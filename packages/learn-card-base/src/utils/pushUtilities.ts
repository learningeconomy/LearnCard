import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    PushNotificationSchema,
    Token,
    ActionPerformed,
} from '@capacitor/push-notifications';
import { RouteComponentProps } from 'react-router-dom';
import { handlePushNotificationActionPerformed } from 'learn-card-base/helpers/pushNotificationHelpers';

import authStore from 'learn-card-base/stores/authStore';

const pushNotificationsSupported = () => Capacitor.isNativePlatform();

const DEFAULT_PERMISSION_STATE = 'NOT_SUPPORTED';

export const pushUtilities = {
    /**
     * Get the current state of the notification permission.
     *
     * Returns:
     *  - NOT_SUPPORTED
     *  - PENDING
     *  - DENIED
     *  - GRANTED
     */
    getPushNotificationPermissionState: async () => {
        try {
            if (pushNotificationsSupported()) {
                const result = await PushNotifications.checkPermissions();
                if (result?.receive) {
                    switch (result?.receive) {
                        case 'prompt':
                        case 'prompt-with-rationale':
                            // The user has not been prompted for the permission yet
                            return 'PENDING';

                        case 'denied':
                            return 'DENIED';

                        case 'granted':
                            return 'GRANTED';

                        default:
                            console.error(
                                `Unexpected PushNotifications.checkPermissions() result: '${JSON.stringify(
                                    result
                                )}'! Defaulting to '${DEFAULT_PERMISSION_STATE}'`
                            );
                            return DEFAULT_PERMISSION_STATE;
                    }
                }
            } else {
                if (process.env.NODE_ENV !== 'production')
                    console.debug(`Push notifications are NOT supported`);
            }
        } catch (err) {
            console.error(
                `Issue checking notification permission state. Defaulting to ${DEFAULT_PERMISSION_STATE}.`,
                err
            );
        }

        // Return the default state
        return DEFAULT_PERMISSION_STATE;
    },

    syncPushToken: async () => {
        if (!pushNotificationsSupported()) return;

        try {
            const permissionState = await pushUtilities.getPushNotificationPermissionState();

            if (permissionState === 'GRANTED') {
                await PushNotifications.register();
            } else if (permissionState === 'PENDING') {
                console.info('Push permissions pending - registration skipped');
            } else {
                console.warn(`Push permissions denied or not supported: ${permissionState}`);
            }
        } catch (err) {
            console.error(`Failed to sync push token:`, err);
            throw err;
        }
    },

    revokePushToken: async (initWallet: any, token: string) => {
        if (!pushNotificationsSupported()) return;

        try {
            const wallet = await initWallet();
            await PushNotifications.removeAllListeners();

            await wallet?.invoke?.unregisterDeviceForPushNotifications(token);

            authStore.set.deviceToken(null);
        } catch (error) {
            console.error('Failed to revoke push token:', error);
            throw error;
        }
    },

    addBackgroundPushNotificationListeners: async (
        initWallet: any,
        history: RouteComponentProps['history'],
        syncToken: boolean,
        handleNotificationRegistrationError?: (text: string) => void
    ) => {
        if (!pushNotificationsSupported()) return;

        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token: Token) => {
            try {
                const wallet = await initWallet();

                await wallet?.invoke?.registerDeviceForPushNotifications(token?.value);
                authStore.set.deviceToken(token?.value);
                console.info('Device successfully registered for push notifications');
            } catch (error) {
                console.error('Failed to register device for push notifications:', error);
                const errMsg =
                    error instanceof Error
                        ? error.message
                        : typeof error === 'string'
                        ? error
                        : 'Unknown error';
                if (!errMsg.includes('Error, no valid private key found')) {
                    handleNotificationRegistrationError?.(`Registration failed: ${errMsg}`);
                }
            }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Push notification registration error:', error);
            handleNotificationRegistrationError?.(
                `Registration error: ${error.message || 'Unknown error'}`
            );
        });

        PushNotifications.addListener(
            'pushNotificationReceived',
            (payload: PushNotificationSchema) => {
                console.info('Push notification received:', payload);
                // Handle received notification if needed
            }
        );

        PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (payload: ActionPerformed) => {
                console.info('Push notification action performed:', payload);
                handlePushNotificationActionPerformed(payload, history);
            }
        );

        if (syncToken) {
            await pushUtilities.syncPushToken();
        }
    },

    requestPermissions: async (): Promise<boolean> => {
        if (!pushNotificationsSupported()) {
            console.warn('Push notifications not supported on this platform');
            return false;
        }

        try {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
                console.info('Requesting push notification permissions...');
                permStatus = await PushNotifications.requestPermissions();
            }

            const isGranted = permStatus.receive === 'granted';

            if (isGranted) {
                console.info('Push notification permissions granted');
            } else {
                console.warn('Push notification permissions denied');
            }

            return isGranted;
        } catch (error) {
            console.error('Failed to request push notification permissions:', error);
            return false;
        }
    },

    registerForNotifications: async (callback?: (success: boolean) => void) => {
        if (!pushNotificationsSupported()) {
            callback?.(false);
            return;
        }

        try {
            const hasPermission = await pushUtilities.requestPermissions();

            if (!hasPermission) {
                callback?.(false);
                return;
            }

            await PushNotifications.register();
            callback?.(true);
        } catch (error) {
            console.error('Failed to register for notifications:', error);
            callback?.(false);
        }
    },

    getDeliveredNotifications: async () => {
        if (!pushNotificationsSupported()) {
            return [];
        }

        try {
            const result = await PushNotifications.getDeliveredNotifications();
            return result.notifications || [];
        } catch (error) {
            console.error('Failed to get delivered notifications:', error);
            return [];
        }
    },

    removeDeliveredNotifications: async (notificationIds?: string[]) => {
        if (!pushNotificationsSupported()) return;

        try {
            if (notificationIds && notificationIds.length > 0) {
                await PushNotifications.removeDeliveredNotifications({
                    notifications: notificationIds.map(id => ({ id, data: {} })),
                });
            } else {
                await PushNotifications.removeAllDeliveredNotifications();
            }
        } catch (error) {
            console.error('Failed to remove delivered notifications:', error);
        }
    },

    /**
     * Clean up all listeners and resources
     */
    cleanup: async () => {
        if (pushNotificationsSupported()) {
            await PushNotifications.removeAllListeners();
        }
    },
};

export { pushUtilities as default };
