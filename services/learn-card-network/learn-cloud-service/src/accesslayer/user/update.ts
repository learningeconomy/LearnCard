import { deleteCachedUsersForDid } from '@cache/user';
import { Users } from '.';
import { flushIndexCacheForDid } from '@cache/indexPlane';

export const addDidToUser = async (primaryDid: string, did: string): Promise<boolean> => {
    try {
        await Promise.all([flushIndexCacheForDid(primaryDid), flushIndexCacheForDid(did)]);
        await Promise.all([deleteCachedUsersForDid(primaryDid), deleteCachedUsersForDid(did)]);

        return Boolean(
            (
                await Users.updateOne(
                    { did: primaryDid },
                    { $push: { associatedDids: did, dids: did } }
                )
            ).modifiedCount
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const removeDidFromUser = async (primaryDid: string, did: string): Promise<boolean> => {
    try {
        await Promise.all([flushIndexCacheForDid(primaryDid), flushIndexCacheForDid(did)]);
        await Promise.all([deleteCachedUsersForDid(primaryDid), deleteCachedUsersForDid(did)]);

        return Boolean(
            (
                await Users.updateOne(
                    { did: primaryDid },
                    { $pull: { associatedDids: did, dids: did } }
                )
            ).modifiedCount
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const setDidAsPrimary = async (
    currentPrimary: string,
    newPrimary: string
): Promise<boolean> => {
    try {
        await Promise.all([
            flushIndexCacheForDid(currentPrimary),
            flushIndexCacheForDid(newPrimary),
        ]);
        await Promise.all([
            deleteCachedUsersForDid(currentPrimary),
            deleteCachedUsersForDid(newPrimary),
        ]);

        return Boolean(
            (
                await Users.updateOne(
                    { did: currentPrimary },
                    {
                        $push: {
                            associatedDids: currentPrimary,
                            dids: { $each: [newPrimary], $position: 0 },
                        },
                        $set: { did: newPrimary },
                    }
                )
            ).modifiedCount
        );
    } catch (e) {
        console.error(e);
        return false;
    }
};
