import { MongoPreferencesType } from '@models';
import { Preferences } from '.';

export const getPreferencesForDid = async (did: string): Promise<MongoPreferencesType | null> => {
    try {
        const preferences = await Preferences.findOne({ did });
        return preferences;
    } catch (e) {
        console.error(e);
        throw new Error(`Failed to get preferences for user with DID: ${did}`);
    }
};
