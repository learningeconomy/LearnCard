import { ObjectId, type Filter } from 'mongodb';
import type { MongoCustomDocumentType } from '@models';
import { CustomDocuments } from '.';
import { getUserForDid } from '@accesslayer/user/read';

export const getCustomDocumentByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    includeAssociatedDids = true
): Promise<MongoCustomDocumentType | null | undefined> => {
    try {
        if (!includeAssociatedDids) return await CustomDocuments.findOne({ ...query, did });

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return await CustomDocuments.findOne({ ...query, did: { $in: dids } });
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

export const getCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    cursor?: string,
    limit = 25,
    includeAssociatedDids = true
): Promise<MongoCustomDocumentType[]> => {
    try {
        if (!includeAssociatedDids) {
            return await CustomDocuments.find({
                ...query,
                did,
                ...(cursor ? { cursor: { $gt: cursor } } : {}),
                ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
            })
                .sort({ cursor: 1 })
                .limit(limit)
                .toArray();
        }

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return await CustomDocuments.find({
            ...query,
            did: { $in: dids },
            ...(cursor ? { cursor: { $gt: cursor } } : {}),
            ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
        })
            .sort({ cursor: 1 })
            .limit(limit)
            .toArray();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const countCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    includeAssociatedDids = true
): Promise<number> => {
    try {
        if (!includeAssociatedDids) {
            return await CustomDocuments.countDocuments({
                ...query,
                did,
                ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
            });
        }

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return await CustomDocuments.countDocuments({
            ...query,
            did: { $in: dids },
            ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
        });
    } catch (error) {
        console.error(error);
        return 0;
    }
};

export const getUsageForDid = async (did: string): Promise<number> => {
    return (
        (
            await CustomDocuments.aggregate()
                .match({ did })
                .group({ _id: null, combined_object_size: { $sum: { $bsonSize: '$$ROOT' } } })
                .toArray()
        )?.[0]?.combined_object_size ?? 0
    );
};
