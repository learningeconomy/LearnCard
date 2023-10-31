import { Users } from '.';
import { MongoUserType } from '@models';
import { createUser } from './create';
import { getCachedUserForDid, setCachedUserForDid } from '@cache/user';

export const getUserForDid = async (did: string): Promise<MongoUserType | null> => {
    try {
        const cachedResponse = await getCachedUserForDid(did);

        if (cachedResponse) return cachedResponse;

        const user = await Users.findOne({ dids: did });

        if (user) await setCachedUserForDid(did, user);

        return user;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getAllDidsForDid = async (did: string): Promise<string[]> => {
    let user = await Users.findOne({ dids: did }, { projection: { dids: 1, _id: 0 } });

    if (!user) {
        await createUser(did);

        return [did];
    }

    return user.dids;
};
