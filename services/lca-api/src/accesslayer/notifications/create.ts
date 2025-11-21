import { Notifications } from '.';
import { LCNNotification } from '@learncard/types';
import { v4 as uuidv4 } from 'uuid';

export const createNotification = async (
    notification: LCNNotification
): Promise<string | false> => {
    try {
        return (
            await Notifications.insertOne({
                _id: uuidv4(),
                read: false,
                archived: false,
                sent: new Date().toISOString(),
                ...notification,
            })
        ).insertedId;
    } catch (e) {
        console.error(e);
        return false;
    }
};
