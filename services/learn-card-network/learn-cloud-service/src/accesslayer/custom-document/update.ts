import { ObjectId, type Filter } from 'mongodb';
import type { EncryptedRecord } from '@learncard/types';

import { CustomDocuments } from '.';
import type { MongoCustomDocumentType } from '@models';
import { getUserForDid } from '@accesslayer/user/read';

export const updateCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    update: Partial<EncryptedRecord> = {},
    includeAssociatedDids = true
): Promise<number> => {
    try {
        if (!includeAssociatedDids) {
            return (await CustomDocuments.updateMany({ ...query, did }, update)).modifiedCount;
        }

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return (
            await CustomDocuments.updateMany(
                {
                    ...query,
                    did: { $in: dids },
                    ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
                },
                { $set: { modified: new Date(), ...update } }
            )
        ).modifiedCount;
    } catch (error) {
        console.error(error);
        return 0;
    }
};
