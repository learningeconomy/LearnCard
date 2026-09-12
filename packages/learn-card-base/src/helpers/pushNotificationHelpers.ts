import { ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LCNNotification, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { RouteComponentProps } from 'react-router-dom';

import { getLogger } from '../logging/logger';

const log = getLogger('push-notification-helpers');

// FCM delivers the full LCNNotification as a JSON string on `data.raw`.
export const parseNotificationFromPushRaw = (
    raw: string | undefined | null
): LCNNotification | null => {
    if (!raw) return null;

    try {
        return JSON.parse(raw) as LCNNotification;
    } catch (error) {
        log.warn('Failed to parse push notification payload', error);
        return null;
    }
};

export const resolveNotificationRoute = (notification: LCNNotification): string => {
    const { type } = notification;

    switch (type) {
        case LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST:
            return '/notifications';
        case LCNNotificationTypeEnumValidator.enum.CONNECTION_ACCEPTED:
            return '/contacts';
        case LCNNotificationTypeEnumValidator.enum.CREDENTIAL_REFRESHED:
            return resolveCredentialRefreshRoute(notification);
        case LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED:
        case LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED:
            return `/notifications?uri=${notification?.data?.vcUris?.[0]}&claim=true`;
        case LCNNotificationTypeEnumValidator.enum.DEVICE_LINK_REQUEST:
            // Store session data so the app can auto-open the approver overlay
            if (notification.data?.metadata) {
                const meta = notification.data.metadata as Record<string, string>;

                if (meta.sessionId) {
                    window.sessionStorage.setItem('device_link_session_id', meta.sessionId);
                }

                if (meta.shortCode) {
                    window.sessionStorage.setItem('device_link_short_code', meta.shortCode);
                }
            }
            // Navigate to home — the app's AuthCoordinatorProvider will detect
            // the sessionStorage flag and auto-open the approver overlay.
            return '/';
        default:
            return '/';
    }
};

/**
 * Claim-free deep link for a managed credential refresh notification. Carries only
 * the opaque, URL-encoded refreshId — never a credential URI, claim action, or any
 * subject/body data. A missing or malformed refreshId falls back to the plain
 * notifications list, where the in-app card performs the authenticated lookup.
 */
const resolveCredentialRefreshRoute = (notification: LCNNotification): string => {
    const metadata = notification.data?.metadata as Record<string, unknown> | undefined;
    const refreshId = metadata?.refreshId;

    if (typeof refreshId !== 'string' || refreshId.length === 0) return '/notifications';

    return `/notifications?refreshId=${encodeURIComponent(refreshId)}&refresh=true`;
};

export const getNotificationToastCopy = (
    notification: LCNNotification
): { title: string; body: string } => {
    const fromName =
        typeof notification.from === 'string' ? '' : (notification.from?.displayName ?? '');

    if (notification.message?.title || notification.message?.body) {
        return {
            title: notification.message?.title ?? 'New notification',
            body: notification.message?.body ?? '',
        };
    }

    switch (notification.type) {
        case LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST:
            return {
                title: 'New connection request',
                body: fromName ? `${fromName} wants to connect` : 'Someone wants to connect',
            };
        case LCNNotificationTypeEnumValidator.enum.CONNECTION_ACCEPTED:
            return {
                title: 'Connection accepted',
                body: fromName ? `You're now connected with ${fromName}` : "You're now connected",
            };
        case LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED:
        case LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED:
            return {
                title: 'New credential received',
                body: fromName ? `${fromName} sent you a credential` : 'You received a credential',
            };
        case LCNNotificationTypeEnumValidator.enum.CREDENTIAL_REFRESHED:
            // Generic by design: the credential is identified only after the holder
            // authenticates and fetches it. No subject, title, or summary here.
            return {
                title: 'Credential updated',
                body: fromName
                    ? `${fromName} updated one of your credentials`
                    : 'One of your credentials was updated',
            };
        case LCNNotificationTypeEnumValidator.enum.PRESENTATION_REQUEST:
            return {
                title: 'New request',
                body: fromName
                    ? `${fromName} requested information`
                    : 'Someone requested information',
            };
        case LCNNotificationTypeEnumValidator.enum.GUARDIAN_APPROVAL_PENDING:
            return { title: 'Approval needed', body: 'A request is waiting for your approval' };
        default:
            return { title: 'New notification', body: fromName ? `From ${fromName}` : '' };
    }
};

export const handlePushNotificationActionPerformed = (
    notificationPayload: ActionPerformed,
    history: RouteComponentProps['history']
) => {
    if (!notificationPayload) return;
    if (!history) return;

    const notification = parseNotificationFromPushRaw(notificationPayload.notification?.data?.raw);

    if (!notification) return;

    history.push(resolveNotificationRoute(notification));
};

export const parseForegroundPushNotification = (
    payload: PushNotificationSchema
): LCNNotification | null => parseNotificationFromPushRaw(payload?.data?.raw);

export const getNotificationSenderImage = (notification: LCNNotification): string | undefined =>
    typeof notification.from === 'string' ? undefined : notification.from?.image;

// Notification types that are too noisy / low-signal to surface as an in-app
// toast. They still land in the Alerts list and badge.
const TOAST_EXCLUDED_TYPES: LCNNotification['type'][] = [
    LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
];

export const shouldToastNotification = (notification: LCNNotification): boolean =>
    !TOAST_EXCLUDED_TYPES.includes(notification.type);

export { handlePushNotificationActionPerformed as default };
