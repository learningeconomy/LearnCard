import { MongoPushTokenType } from '@models';
import { PushTokens } from '.';
import { v4 as uuidv4 } from 'uuid';
import { isTokenValidForDid } from './read';
import { updatePushNotificationRegistration } from './update';

export const createPushNotificationRegistration = async (
    pushToken: MongoPushTokenType
): Promise<string | boolean> => {
    try {
        if (await isTokenValidForDid(pushToken.did, pushToken.token)) {
            await updatePushNotificationRegistration(pushToken.did, pushToken.token);
            return true;
        } else {
            return (
                await PushTokens.insertOne({
                    _id: uuidv4(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ...pushToken,
                })
            ).insertedId;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};
