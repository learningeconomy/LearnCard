import { MongoServerError } from 'mongodb';
import { TRPCError } from '@trpc/server';
import { EncryptedCredentialRecord } from '@learncard/types';

import { getCredentialRecordCollection } from '.';

export const updateCredentialRecord = async (
    did: string | string[],
    id: string,
    updates: Partial<EncryptedCredentialRecord>
): Promise<number | false> => {
    try {
        return (
            await getCredentialRecordCollection().updateMany(
                { did: Array.isArray(did) ? { $in: did } : did, id },
                { $set: { modified: new Date(), ...updates } }
            )
        ).modifiedCount;
    } catch (error) {
        // 11000 is the Mongo Duplicate Key Error Code
        if (error instanceof MongoServerError && error.code === 11000) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Record with that ID already exists!',
            });
        }
        console.error(error);

        return false;
    }
};

/** Match the encrypted revision at write time, preserving the record's storage identity. */
export const replaceCredentialRecordIfCurrent = async (
    dids: string[],
    record: EncryptedCredentialRecord,
    expectedCiphertext: string
): Promise<boolean> => {
    const result = await getCredentialRecordCollection().updateOne(
        { did: { $in: dids }, id: record.id, 'encryptedRecord.ciphertext': expectedCiphertext },
        [
            {
                $replaceWith: {
                    $mergeObjects: [
                        { $literal: record },
                        {
                            _id: '$_id',
                            did: '$did',
                            cursor: '$cursor',
                            created: '$created',
                            modified: '$$NOW',
                        },
                    ],
                },
            },
        ]
    );
    return result.matchedCount === 1;
};
