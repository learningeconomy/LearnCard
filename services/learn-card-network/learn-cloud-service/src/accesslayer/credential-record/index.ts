import mongodb from '@mongo';

import { CREDENTIAL_RECORD_COLLECTION, MongoCredentialRecordType } from '@models';

export const getCredentialRecordCollection = () => {
    return mongodb.collection<MongoCredentialRecordType>(CREDENTIAL_RECORD_COLLECTION);
};

export const CredentialRecords = getCredentialRecordCollection();

CredentialRecords.createIndex({ cursor: 1 }, { unique: true });
CredentialRecords.createIndex({ did: 1, cursor: 1 }, { unique: true });
CredentialRecords.createIndex({ did: 1, fields: 1, cursor: 1 });
