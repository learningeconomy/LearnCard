import mongodb from '@mongo';

import { USER_COLLECTION, MongoUserType } from '@models';

export const getUserCollection = () => {
    return mongodb.collection<MongoUserType>(USER_COLLECTION);
};

export const Users = getUserCollection();

Users.createIndex({ did: 1 }, { unique: true });
Users.createIndex({ did: 1, associatedDids: 1 });
