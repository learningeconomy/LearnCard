import { getAllDidsForDid, getUserForDid } from '@accesslayer/user/read';
import { CredentialRecords } from '.';
import type { MongoCredentialRecordType } from '@models';
import type { Filter } from 'mongodb';

export const getCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {},
    sort: 'newestFirst' | 'oldestFirst' = 'newestFirst',
    cursor?: string,
    limit = 25,
    includeAssociatedDids = true
): Promise<MongoCredentialRecordType[]> => {
    try {
        if (!includeAssociatedDids) {
            return await CredentialRecords.find({
                ...query,
                did,
                ...(cursor ? { cursor: { [sort === 'newestFirst' ? '$lt' : '$gt']: cursor } } : {}),
            })
                .sort({ cursor: sort === 'newestFirst' ? -1 : 1 })
                .limit(limit)
                .toArray();
        }

        const dids = await getAllDidsForDid(did);

        return await CredentialRecords.find({
            ...query,
            did: { $in: dids },
            ...(cursor ? { cursor: { [sort === 'newestFirst' ? '$lt' : '$gt']: cursor } } : {}),
        })
            .sort({ cursor: sort === 'newestFirst' ? -1 : 1 })
            .limit(limit)
            .toArray();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const countCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {},
    includeAssociatedDids = true
): Promise<number> => {
    try {
        if (!includeAssociatedDids) {
            return await CredentialRecords.countDocuments({
                ...query,
                did,
            });
        }

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return await CredentialRecords.countDocuments({
            ...query,
            did: { $in: dids },
        });
    } catch (error) {
        console.error(error);
        return 0;
    }
};
