import { Notifications } from '.';

export const deleteNotificationById = async (_id: string): Promise<number | false> => {
    try {
        return (await Notifications.deleteOne({ _id })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
