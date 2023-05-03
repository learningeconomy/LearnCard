import mongodb from '@mongo';

import { CREDENTIAL_RECORD_COLLECTION, MongoCredentialRecordType } from '@models';

export const getCredentialRecordCollection = () => {
    return mongodb.collection<MongoCredentialRecordType>(CREDENTIAL_RECORD_COLLECTION);
};
