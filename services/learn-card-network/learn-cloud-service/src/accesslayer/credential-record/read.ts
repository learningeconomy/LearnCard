import { getCredentialRecordCollection } from '.';
import { MongoCredentialRecordType } from '@models';
import { Filter } from 'mongodb';

export const getCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {},
    cursor?: string,
    limit = 25
): Promise<MongoCredentialRecordType[]> => {
    try {
        return await getCredentialRecordCollection()
            .find({ ...query, did, ...(cursor ? { cursor: { $gt: Number(cursor) } } : {}) })
            .sort({ cursor: 1 })
            .limit(limit)
            .toArray();
    } catch (e) {
        console.error(e);
        return [];
    }
};
