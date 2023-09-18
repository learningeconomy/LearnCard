import { deleteCachedUsersForDid } from '@cache/user';
import { Users } from '.';

export const deleteUserByDid = async (did: string): Promise<number | false> => {
    try {
        await deleteCachedUsersForDid(did);

        return (await Users.deleteOne({ did })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
