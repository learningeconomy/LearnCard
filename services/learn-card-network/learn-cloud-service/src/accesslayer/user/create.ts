import { MongoUserType } from '@models';
import { Users } from '.';
import { getUserForDid } from './read';
import { getCachedUserForDid, setCachedUserForDid } from '@cache/user';

export const createUser = async (did: string): Promise<string | false> => {
    try {
        const newUser = { did, associatedDids: [] };

        const id = (await Users.insertOne(newUser)).insertedId.toString();

        if (id) await setCachedUserForDid(did, newUser);

        return id;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const ensureUserForDid = async (did: string): Promise<MongoUserType> => {
    const cachedResponse = await getCachedUserForDid(did);

    if (cachedResponse) return cachedResponse;

    const user = await getUserForDid(did);

    if (user) {
        await setCachedUserForDid(did, user);

        return user;
    }

    await createUser(did);

    const newUser = await getUserForDid(did);

    if (!newUser) throw new Error('Something went wrong creating the user!');

    await setCachedUserForDid(did, newUser);

    return newUser;
};
