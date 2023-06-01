import { MongoServerError } from 'mongodb';
import { TRPCError } from '@trpc/server';
import { EncryptedCredentialRecord } from '@learncard/types';

import { getCredentialRecordCollection } from '.';

export const updateCredentialRecord = async (
    did: string,
    id: string,
    updates: Partial<EncryptedCredentialRecord>
): Promise<number | false> => {
    try {
        return (
            await getCredentialRecordCollection().updateOne(
                { did, id },
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
