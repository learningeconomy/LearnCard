import { ActionPerformed } from '@capacitor/push-notifications';
import { LCNNotification, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { RouteComponentProps } from 'react-router-dom';

export const handlePushNotificationActionPerformed = (
    notificationPayload: ActionPerformed,
    history: RouteComponentProps["history"]
) => {
    if (!notificationPayload) return;
    if (!history) return;

    const notification: LCNNotification = JSON.parse(notificationPayload.notification.data.raw);

    const { from, type } = notification;

    const recipient = typeof from === 'string' ? from : from?.profileId;

    switch (type) {
        case LCNNotificationTypeEnumValidator.Enum.CONNECTION_REQUEST:
            history.push(`/notifications`);
            break;
        case LCNNotificationTypeEnumValidator.Enum.CONNECTION_ACCEPTED:
            history.push(`/contacts`);
            break;
        case LCNNotificationTypeEnumValidator.Enum.BOOST_RECEIVED:
        case LCNNotificationTypeEnumValidator.Enum.CREDENTIAL_RECEIVED:
            history.push(`/notifications?uri=${notification?.data?.vcUris?.[0]}&claim=true`);
            break;
        case LCNNotificationTypeEnumValidator.Enum.PRESENTATION_RECEIVED:
            // TODO: handle VP redirect
            break;
        default:
            history.push('/');
            break;
    }
};

export { handlePushNotificationActionPerformed as default };
