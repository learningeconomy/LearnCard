import { getCredentialRecordCollection } from '.';
import { MongoCredentialRecordType } from '@models';
import { Filter } from 'mongodb';

export const getCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {}
): Promise<MongoCredentialRecordType[]> => {
    try {
        return await getCredentialRecordCollection()
            .find({ ...query, did })
            .toArray();
    } catch (e) {
        console.error(e);
        return [];
    }
};
