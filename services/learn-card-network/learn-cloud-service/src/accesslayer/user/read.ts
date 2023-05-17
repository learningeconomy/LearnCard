import { Users } from '.';
import { MongoUserType } from '@models';
import { ensureUserForDid } from './create';

export const getUserByDid = async (did: string): Promise<MongoUserType | null> => {
    try {
        return await Users.findOne({ did });
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getUserForDid = async (did: string): Promise<MongoUserType | null> => {
    try {
        return await Users.findOne({ $or: [{ did }, { associatedDids: did }] });
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getAllDidsForDid = async (did: string): Promise<string[]> => {
    const user = await ensureUserForDid(did);

    return [user.did, ...user.associatedDids];
};
