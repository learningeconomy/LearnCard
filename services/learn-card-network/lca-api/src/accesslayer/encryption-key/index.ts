import { ENCRYPTION_KEYS_COLLECTION, MongoEncryptionKeyType } from '@models';
import mongodb from '@mongo';

export const getEncryptionKeysCollection = () => {
    return mongodb.collection<MongoEncryptionKeyType>(ENCRYPTION_KEYS_COLLECTION);
};

export const EncryptionKeys = getEncryptionKeysCollection();
