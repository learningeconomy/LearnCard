import { v4 as uuid } from 'uuid';

import { CredentialRecords } from '.';
import { EncryptedCredentialRecord } from '@learncard/types';
import { incrementUserCursor } from '@accesslayer/user/update';
import { MongoCredentialRecordType } from '@models';

export const createCredentialRecord = async (
    did: string,
    _record: EncryptedCredentialRecord
): Promise<string | false> => {
    const { id = uuid(), ...record } = _record;

    try {
        const cursor = await incrementUserCursor(did);

        if (cursor === false) return false;

        return (
            await CredentialRecords.insertOne({
                cursor,
                did,
                _id: id,
                created: new Date(),
                modified: new Date(),
                ...record,
            })
        ).insertedId;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createCredentialRecords = async (
    did: string,
    _records: Omit<EncryptedCredentialRecord, 'id'>[]
): Promise<number> => {
    const length = _records.length;
    const newCursor = await incrementUserCursor(did, length);

    if (newCursor === false) return 0;

    const records = _records.map((_record, index) => {
        const { id = uuid(), ...record } = _record;

        return {
            did,
            _id: id,
            cursor: newCursor - length + index + 1,
            created: new Date(),
            modified: new Date(),
            ...record,
        } as MongoCredentialRecordType;
    });

    try {
        return (await CredentialRecords.insertMany(records)).insertedCount;
    } catch (e) {
        console.error(e);
        return 0;
    }
};
