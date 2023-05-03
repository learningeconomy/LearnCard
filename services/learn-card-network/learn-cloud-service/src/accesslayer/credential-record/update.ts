import { getCredentialRecordCollection } from '.';
import { EncryptedCredentialRecord } from '@learncard/types';

export const updateCredentialRecord = async (
    did: string,
    id: string,
    updates: Partial<EncryptedCredentialRecord>
): Promise<number | false> => {
    try {
        return (
            await getCredentialRecordCollection().updateOne({ did, _id: id }, { $set: updates })
        ).modifiedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
