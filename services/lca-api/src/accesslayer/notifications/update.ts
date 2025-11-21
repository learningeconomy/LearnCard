import { Notifications } from '.';
import { NotificationMetaType } from 'types/notifications';

export const updateNotificationMeta = async (
    _id: string,
    notificationMeta: NotificationMetaType
): Promise<number | false> => {
    try {
        return (await Notifications.updateOne({ _id }, { $set: notificationMeta })).modifiedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const markAllNotificationsReadForUser = async (
    profileDid: string
): Promise<number | false> => {
    try {
        return (
            await Notifications.updateMany({ 'to.did': profileDid }, { $set: { read: true } })
        ).modifiedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
