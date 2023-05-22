import { Credentials } from '.';
import { JWE } from '@learncard/types';

export const createCredential = async (jwe: JWE): Promise<string | false> => {
    try {
        return (await Credentials.insertOne({ jwe: jwe })).insertedId.toString();
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const createCredentialRecords = async (jwes: JWE[]): Promise<number> => {
    const documents = jwes.map(jwe => ({ jwe }));

    try {
        return (await Credentials.insertMany(documents)).insertedCount;
    } catch (e) {
        console.error(e);
        return 0;
    }
};
