import { v4 as uuid } from 'uuid';

import { getCredentialRecordCollection } from '.';
import { EncryptedCredentialRecord } from '@learncard/types';

export const createCredentialRecord = async (
    did: string,
    _record: EncryptedCredentialRecord
): Promise<string | false> => {
    const { id = uuid(), ...record } = _record;

    try {
        return (await getCredentialRecordCollection().insertOne({ did, _id: id, ...record }))
            .insertedId;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createCredentialRecords = async (
    did: string,
    _records: EncryptedCredentialRecord[]
): Promise<number> => {
    const records = _records.map(_record => {
        const { id = uuid(), ...record } = _record;

        return { did, _id: id, ...record };
    });

    try {
        return (await getCredentialRecordCollection().insertMany(records)).insertedCount;
    } catch (e) {
        console.error(e);
        return 0;
    }
};
