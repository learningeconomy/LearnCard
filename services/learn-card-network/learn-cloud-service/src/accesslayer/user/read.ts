import { Users } from '.';
import { MongoUserType } from '@models';
import { ensureUserForDid } from './create';
import { getCachedUserForDid, setCachedUserForDid } from '@cache/user';

export const getUserForDid = async (did: string): Promise<MongoUserType | null> => {
    try {
        const cachedResponse = await getCachedUserForDid(did);

        if (cachedResponse) return cachedResponse;

        const user = await Users.findOne({ $or: [{ did }, { associatedDids: did }] });

        if (user) await setCachedUserForDid(did, user);

        return user;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getAllDidsForDid = async (did: string): Promise<string[]> => {
    const user = await ensureUserForDid(did);

    return [user.did, ...user.associatedDids];
};
