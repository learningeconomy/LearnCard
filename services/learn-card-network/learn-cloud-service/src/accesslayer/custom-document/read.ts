import { Filter } from 'mongodb';

import { MongoCustomDocumentType } from '@models';
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
    } catch (e) {
        console.error(e);
        return undefined;
    }
};

export const getCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    includeAssociatedDids = true
): Promise<MongoCustomDocumentType[]> => {
    try {
        if (!includeAssociatedDids) return await CustomDocuments.find({ ...query, did }).toArray();

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return await CustomDocuments.find({ ...query, did: { $in: dids } }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const countCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    includeAssociatedDids = true
): Promise<number> => {
    try {
        if (!includeAssociatedDids) return await CustomDocuments.countDocuments({ ...query, did });

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return await CustomDocuments.countDocuments({ ...query, did: { $in: dids } });
    } catch (e) {
        console.error(e);
        return 0;
    }
};
