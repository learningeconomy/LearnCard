import { getAllDidsForDid, getUserForDid } from '@accesslayer/user/read';
import { CredentialRecords } from '.';
import { MongoCredentialRecordType } from '@models';
import { Filter } from 'mongodb';

export const getCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {},
    sort: 'newestFirst' | 'oldestFirst',
    cursor?: string,
    limit = 25,
    includeAssociatedDids = true
): Promise<MongoCredentialRecordType[]> => {
    // Failures throw: an empty array here means "no records", and index.get caches it (LC-2434).
    const dids = includeAssociatedDids ? { $in: await getAllDidsForDid(did) } : did;

    return CredentialRecords.find({
        ...query,
        did: dids,
        ...(cursor ? { cursor: { [sort === 'newestFirst' ? '$lt' : '$gt']: cursor } } : {}),
    })
        .sort({ cursor: sort === 'newestFirst' ? -1 : 1 })
        .limit(limit)
        .toArray();
};

export const countCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {},
    includeAssociatedDids = true
): Promise<number> => {
    // Failures throw rather than read as 0 (LC-2434).
    if (!includeAssociatedDids) return CredentialRecords.countDocuments({ ...query, did });

    const user = await getUserForDid(did);

    const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

    return CredentialRecords.countDocuments({ ...query, did: { $in: dids } });
};
