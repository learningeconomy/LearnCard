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

export const getCredentialsById = async (_ids: string[]) => {
    try {
        const ids = _ids.map(id => new ObjectId(id));

        return await Credentials.find({ _id: { $in: ids } }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    }
};
