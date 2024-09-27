import { ClientSession } from 'mongodb';

import { deleteCachedUsersForDid } from '@cache/user';
import { Users } from '.';

export const deleteUserByDid = async (
    did: string,
    session?: ClientSession
): Promise<number | false> => {
    try {
        await deleteCachedUsersForDid(did);

        return (await Users.deleteOne({ did }, { session })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
