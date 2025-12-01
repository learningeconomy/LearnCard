import { PushTokens } from '.';

export const updatePushNotificationRegistration = async (
    did: string,
    token: string
): Promise<number | false> => {
    try {
        return (await PushTokens.updateOne({ did, token }, { $set: { updatedAt: new Date() } }))
            .modifiedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
