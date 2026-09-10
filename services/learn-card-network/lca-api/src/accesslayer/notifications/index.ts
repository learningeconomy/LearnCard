import { NOTIFICATIONS_COLLECTION, MongoNotificationType } from '@models';
import mongodb from '@mongo';

export const getNotificationsCollection = () => {
    return mongodb.collection<MongoNotificationType>(NOTIFICATIONS_COLLECTION);
};

export const Notifications = getNotificationsCollection();

Notifications.createIndex({ 'to.did': 1, read: 1, sent: -1, _id: 1 });
Notifications.createIndex({
    'to.did': 1,
    type: 1,
    'data.metadata.connectionPrompt.promptId': 1,
});
