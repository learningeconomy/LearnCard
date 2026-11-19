import { ClientSession } from 'mongodb';
import { Users } from '.';
import { MongoUserType } from '@models';
import { createUser } from './create';
import { getCachedUserForDid, setCachedUserForDid } from '@cache/user';

export const getUserForDid = async (
    did: string,
    session?: ClientSession
): Promise<MongoUserType | null> => {
    const cachedResponse = await getCachedUserForDid(did);

    if (cachedResponse) return cachedResponse;

    // A failed lookup throws: null means "no user", and callers act on that (LC-2434).
    const user = await Users.findOne({ dids: did }, { session });

    if (user) await setCachedUserForDid(did, user);

    return user;
};

export const getAllDidsForDid = async (did: string, session?: ClientSession): Promise<string[]> => {
    let user = await Users.findOne({ dids: did }, { projection: { dids: 1, _id: 0 }, session });

    if (!user) {
        await createUser(did, session);

        return [did];
    }

    return user.dids;
};
