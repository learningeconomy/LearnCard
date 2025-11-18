import { PUSH_TOKENS_COLLECTION, MongoPushTokenType } from '@models';
import mongodb from '@mongo';

export const getPushTokensCollection = () => {
    return mongodb.collection<MongoPushTokenType>(PUSH_TOKENS_COLLECTION);
};

export const PushTokens = getPushTokensCollection();
