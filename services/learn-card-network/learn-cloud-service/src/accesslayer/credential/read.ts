import { Credentials } from '.';
import { ObjectId } from 'mongodb';

export const getCredentialById = async (_id: string) => {
    try {
        return await Credentials.findOne({ _id: new ObjectId(_id) });
    } catch (e) {
        console.error(e);
        return undefined;
    }
};
