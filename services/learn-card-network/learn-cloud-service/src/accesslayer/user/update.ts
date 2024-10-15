import { ClientSession } from 'mongodb';

import { deleteCachedUsersForDid } from '@cache/user';
import { Users } from '.';
import { flushIndexCacheForDid } from '@cache/indexPlane';

export const addDidToUser = async (
    primaryDid: string,
    did: string,
    session?: ClientSession
): Promise<boolean> => {
    try {
        const result = Boolean(
            (
                await Users.updateOne(
                    { did: primaryDid },
                    { $addToSet: { associatedDids: did, dids: did } },
                    { session }
                )
            ).modifiedCount
        );
        await Promise.all([
            flushIndexCacheForDid(primaryDid, true, session),
            flushIndexCacheForDid(did, true, session),
        ]);
        await Promise.all([deleteCachedUsersForDid(primaryDid), deleteCachedUsersForDid(did)]);

        return result;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const removeDidFromUser = async (
    primaryDid: string,
    did: string,
    session?: ClientSession
): Promise<boolean> => {
    try {
        const result = Boolean(
            (
                await Users.updateOne(
                    { did: primaryDid },
                    { $pull: { associatedDids: did, dids: did } },
                    { session }
                )
            ).modifiedCount
        );

        await Promise.all([
            flushIndexCacheForDid(primaryDid, true, session),
            flushIndexCacheForDid(did, true, session),
        ]);
        await Promise.all([deleteCachedUsersForDid(primaryDid), deleteCachedUsersForDid(did)]);

        return result;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const setDidAsPrimary = async (
    currentPrimary: string,
    newPrimary: string,
    session?: ClientSession
): Promise<boolean> => {
    try {
        const result = Boolean(
            (
                await Users.updateOne(
                    { did: currentPrimary },
                    {
                        $addToSet: { associatedDids: currentPrimary, dids: newPrimary },
                        $set: { did: newPrimary },
                    },
                    { session }
                )
            ).modifiedCount
        );

        await Promise.all([
            flushIndexCacheForDid(currentPrimary, true, session),
            flushIndexCacheForDid(newPrimary, true, session),
        ]);
        await Promise.all([
            deleteCachedUsersForDid(currentPrimary),
            deleteCachedUsersForDid(newPrimary),
        ]);

        return result;
    } catch (e) {
        console.error(e);
        return false;
    }
};
