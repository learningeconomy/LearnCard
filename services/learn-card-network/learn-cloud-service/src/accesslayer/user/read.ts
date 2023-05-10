import { Users } from '.';
import { MongoUserType } from '@models';

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
