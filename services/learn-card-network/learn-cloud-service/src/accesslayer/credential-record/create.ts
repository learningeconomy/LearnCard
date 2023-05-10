import { CredentialRecords } from '.';
import { EncryptedCredentialRecord } from '@learncard/types';
import { MongoCredentialRecordType } from '@models';
import { ObjectId } from 'mongodb';

export const createCredentialRecord = async (
    did: string,
    _record: EncryptedCredentialRecord
): Promise<string | false> => {
    const { id, ...record } = _record;
    const cursor = new ObjectId().toString();

    try {
        return (
            await CredentialRecords.insertOne({
                cursor,
                did,
                id: id || cursor,
                created: new Date(),
                modified: new Date(),
                ...record,
            })
        ).insertedId.toString();
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createCredentialRecords = async (
    did: string,
    _records: Omit<EncryptedCredentialRecord, 'id'>[]
): Promise<number> => {
    const records = _records.map(_record => {
        const { id, ...record } = _record;
        const cursor = new ObjectId().toString();

        return {
            did,
            id: id || cursor,
            cursor,
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
