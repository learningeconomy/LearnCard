import mongodb from '@mongo';

import { CREDENTIAL_COLLECTION, MongoCredentialType } from '@models';

export const getCredentialCollection = () => {
    return mongodb.collection<MongoCredentialType>(CREDENTIAL_COLLECTION);
};

export const Credentials = getCredentialCollection();
