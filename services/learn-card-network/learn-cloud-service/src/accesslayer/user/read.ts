import type { ClientSession } from 'mongodb';
import { Users } from '.';
import type { MongoUserType } from '@models';
import { createUser } from './create';
import { getCachedUserForDid, setCachedUserForDid } from '@cache/user';

export const getUserForDid = async (
    did: string,
    session?: ClientSession
): Promise<MongoUserType | null> => {
    try {
        const cachedResponse = await getCachedUserForDid(did);

        if (cachedResponse) return cachedResponse;

        const user = await Users.findOne({ dids: did }, { session });

        if (user) await setCachedUserForDid(did, user);

        return user;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getAllDidsForDid = async (did: string, session?: ClientSession): Promise<string[]> => {
    let user = await Users.findOne({ dids: did }, { projection: { dids: 1, _id: 0 }, session });

    if (!user) {
        await createUser(did, session);

        return [did];
    }

    return user.dids;
};
