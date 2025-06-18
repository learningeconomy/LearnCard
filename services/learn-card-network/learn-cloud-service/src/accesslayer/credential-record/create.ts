import { ObjectId, MongoServerError } from 'mongodb';
import { TRPCError } from '@trpc/server';
import type { EncryptedCredentialRecord } from '@learncard/types';

import type { MongoCredentialRecordType } from '@models';
import { CredentialRecords } from '.';

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
    } catch (error) {
        // 11000 is the Mongo Duplicate Key Error Code
        if (error instanceof MongoServerError && error.code === 11_000) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Record with that ID already exists!',
            });
        }
        console.error(error);

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

    const dedupedRecordIds = [...new Set(records.map((record) => record.id))];

    if (dedupedRecordIds.length !== records.length) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Tried to insert multiple records with the same ID',
        });
    }

    try {
        return (await CredentialRecords.insertMany(records)).insertedCount;
    } catch (error) {
        // 11000 is the Mongo Duplicate Key Error Code
        if (error instanceof MongoServerError && error.code === 11_000) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Tried to insert a record with an ID that already exists!',
            });
        }
        console.error(error);
        return 0;
    }
};
