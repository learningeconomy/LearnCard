import { getAllDidsForDid } from '@accesslayer/user/read';
import { getCredentialRecordCollection } from '.';

export const deleteCredentialRecordById = async (
    did: string,
    id: string
): Promise<number | false> => {
    try {
        const dids = await getAllDidsForDid(did);

        return (await getCredentialRecordCollection().deleteOne({ did: { $in: dids }, id }))
            .deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteCredentialRecordsForDid = async (did: string): Promise<number | false> => {
    try {
        return (await getCredentialRecordCollection().deleteMany({ did })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
