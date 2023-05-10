import { MongoUserType } from '@models';
import { Users } from '.';
import { getUserForDid } from './read';

export const createUser = async (did: string): Promise<string | false> => {
    try {
        return (await Users.insertOne({ did, associatedDids: [] })).insertedId.toString();
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const ensureUserForDid = async (did: string): Promise<MongoUserType> => {
    const user = await getUserForDid(did);

    if (user) return user;

    await createUser(did);

    const newUser = await getUserForDid(did);

    if (!newUser) throw new Error('Something went wrong creating the user!');

    return newUser;
};
