import mongodb from '@mongo';

import { CREDENTIAL_RECORD_COLLECTION, MongoCredentialRecordType } from '@models';

export const getCredentialRecordCollection = () => {
    return mongodb.collection<MongoCredentialRecordType>(CREDENTIAL_RECORD_COLLECTION);
};

const CredentialRecords = getCredentialRecordCollection();

CredentialRecords.createIndex({ did: 1, created: 1 });
CredentialRecords.createIndex({ did: 1, fields: 1, created: 1 });
