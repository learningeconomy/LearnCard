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

/** True only for 24-char hex ids. ObjectId.isValid also accepts 12-byte strings. */
export const isMongoObjectIdString = (id: string): boolean => /^[a-fA-F0-9]{24}$/.test(id);

export const getCredentialsById = async (_ids: string[]) => {
    const ids: ObjectId[] = [];
    for (const id of _ids) {
        if (!isMongoObjectIdString(id)) continue;
        try {
            ids.push(new ObjectId(id));
        } catch {
            // Skip a malformed id so it cannot fail the rest of the $in lookup.
        }
    }
    if (ids.length === 0) return [];

    try {
        return await Credentials.find({ _id: { $in: ids } }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    }
};
