import { Credentials } from '.';
import type { JWE } from '@learncard/types';

export const createCredential = async (jwe: JWE): Promise<string | false> => {
    try {
        return (await Credentials.insertOne({ jwe: jwe })).insertedId.toString();
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const createCredentialRecords = async (jwes: JWE[]): Promise<number> => {
    const documents = jwes.map(jwe => ({ jwe }));

    try {
        return (await Credentials.insertMany(documents)).insertedCount;
    } catch (error) {
        console.error(error);
        return 0;
    }
};
