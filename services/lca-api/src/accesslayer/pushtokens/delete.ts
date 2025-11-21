import { RegisterPushInput } from 'types/notifications';
import { PushTokens } from '.';

export const deletePushNotificationRegistration = async (
    pushToken: RegisterPushInput
): Promise<number | false> => {
    try {
        return (await PushTokens.deleteOne({ ...pushToken })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
