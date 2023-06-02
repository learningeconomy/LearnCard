import { Filter, UpdateFilter } from 'mongodb';

import { CustomDocuments } from '.';
import { MongoCustomDocumentType } from '@models';
import { getUserForDid } from '@accesslayer/user/read';

export const updateCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    update: UpdateFilter<MongoCustomDocumentType> = {},
    includeAssociatedDids = true
): Promise<number> => {
    try {
        if (!includeAssociatedDids) {
            return (await CustomDocuments.updateMany({ ...query, did }, update)).modifiedCount;
        }

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return (await CustomDocuments.updateMany({ ...query, did: { $in: dids } }, update))
            .modifiedCount;
    } catch (e) {
        console.error(e);
        return 0;
    }
};
