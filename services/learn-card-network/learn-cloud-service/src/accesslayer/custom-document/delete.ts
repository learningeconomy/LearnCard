import { Filter, ObjectId } from 'mongodb';

import { MongoCustomDocumentType } from '@models';
import { CustomDocuments } from '.';
import { getUserForDid } from '@accesslayer/user/read';

export const deleteCustomDocumentsByQuery = async (
    did: string,
    query: Filter<MongoCustomDocumentType> = {},
    includeAssociatedDids = true
): Promise<number | false> => {
    try {
        if (!includeAssociatedDids) {
            return (
                await CustomDocuments.deleteMany({
                    ...query,
                    did,
                    ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
                })
            ).deletedCount;
        }

        const user = await getUserForDid(did);

        const dids = [user?.did ?? did, ...(user?.associatedDids ?? [])];

        return (
            await CustomDocuments.deleteMany({
                ...query,
                did: { $in: dids },
                ...(typeof query._id === 'string' ? { _id: new ObjectId(query._id) } : {}),
            })
        ).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
