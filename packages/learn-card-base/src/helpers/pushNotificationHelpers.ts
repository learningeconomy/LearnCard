import { ActionPerformed } from '@capacitor/push-notifications';
import { LCNNotification, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { RouteComponentProps } from 'react-router-dom';

export const handlePushNotificationActionPerformed = (
    notificationPayload: ActionPerformed,
    history: RouteComponentProps['history']
) => {
    if (!notificationPayload) return;
    if (!history) return;

    const notification: LCNNotification = JSON.parse(notificationPayload.notification.data.raw);

    const { from, type } = notification;

    const recipient = typeof from === 'string' ? from : from?.profileId;

    switch (type) {
        case LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST:
            history.push(`/notifications`);
            break;
        case LCNNotificationTypeEnumValidator.enum.CONNECTION_ACCEPTED:
            history.push(`/contacts`);
            break;
        case LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED:
        case LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED:
            history.push(`/notifications?uri=${notification?.data?.vcUris?.[0]}&claim=true`);
            break;
        case LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED:
            // TODO: handle VP redirect
            break;
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
            history.push('/');
            break;
        default:
            history.push('/');
            break;
    }
};

export { handlePushNotificationActionPerformed as default };
