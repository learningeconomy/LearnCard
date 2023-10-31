import { getAllDidsForDid, getUserForDid } from '@accesslayer/user/read';
import { CredentialRecords } from '.';
import { MongoCredentialRecordType } from '@models';
import { Filter } from 'mongodb';

export const getCredentialRecordsForDid = async (
    did: string,
    query: Filter<MongoCredentialRecordType> = {},
    cursor?: string,
    limit = 25,
    includeAssociatedDids = true
): Promise<MongoCredentialRecordType[]> => {
    try {
        if (!includeAssociatedDids) {
            return await CredentialRecords.find({
                ...query,
                did,
                ...(cursor ? { cursor: { $gt: cursor } } : {}),
            })
                .sort({ cursor: 1 })
                .limit(limit)
                .toArray();
        }

        const dids = await getAllDidsForDid(did);

        return await CredentialRecords.find({
            ...query,
            did: { $in: dids },
            ...(cursor ? { cursor: { $gt: cursor } } : {}),
        })
            .sort({ cursor: 1 })
            .limit(limit)
            .toArray();
    } catch (e) {
        console.error(e);
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
    } catch (e) {
        console.error(e);
        return 0;
    }
};
