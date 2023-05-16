import { Credentials } from '.';
import { ObjectId } from 'mongodb';

export const deleteCredentialById = async (_id: string): Promise<number | false> => {
    try {
        return (await Credentials.deleteOne({ _id: new ObjectId(_id) })).deletedCount;
    } catch (e) {
        console.error(e);
        return false;
    }
};
