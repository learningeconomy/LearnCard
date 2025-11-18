import crypto from 'crypto';

import { MongoEncryptionKeyType } from '@models';
import { EncryptionKeys } from '.';
import { v4 as uuidv4 } from 'uuid';

export const createEncryptionKeyForDid = async (did: string): Promise<MongoEncryptionKeyType> => {
    const record = {
        _id: uuidv4(),
        did,
        key: crypto.randomBytes(32).toString('hex'),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await EncryptionKeys.insertOne(record);

    return record;
};
