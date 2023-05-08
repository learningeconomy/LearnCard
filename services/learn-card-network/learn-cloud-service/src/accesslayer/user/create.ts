import { Users } from '.';

export const createUser = async (did: string): Promise<string | false> => {
    try {
        return (await Users.insertOne({ did, associatedDids: [] })).insertedId.toString();
    } catch (e) {
        console.error(e);
        return false;
    }
};
