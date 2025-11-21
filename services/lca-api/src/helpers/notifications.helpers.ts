import { getPaginatedNotificationsForDid } from '@accesslayer/notifications/read';
import { MongoNotificationType } from '@models';
import { NotificationsSortEnumValidator } from 'types/notifications';

export const isDidOwnerOfNotification = (
    did: string,
    notification: MongoNotificationType
): boolean => {
    if (typeof notification.to === 'string') {
        return notification.to === did;
    } else {
        return notification.to.did === did;
    }
};

export const getUnreadNotificationsCountForDid = async (did: string): Promise<number> => {
    const unread = await getPaginatedNotificationsForDid(
        did,
        { limit: 30, sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL },
        { read: false }
    );
    if (unread) {
        return unread.notifications.length;
    } else {
        return 0;
    }
};
