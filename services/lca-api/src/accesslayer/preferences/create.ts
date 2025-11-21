import { Preferences } from '.';
import { v4 as uuidv4 } from 'uuid';
import { getPreferencesForDid } from './read';
import { MongoPreferencesValidator } from '@models';

import { ThemeEnum } from '../../types/preferences';

export const createPreferences = async (
    did: string,
    theme: ThemeEnum
): Promise<string | boolean> => {
    try {
        const validation = MongoPreferencesValidator.safeParse({
            _id: uuidv4(),
            did: did,
            theme: theme,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        if (!validation.success) {
            throw new Error(
                `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`
            );
        }

        const existingPreferences = await getPreferencesForDid(did);
        if (existingPreferences) {
            throw new Error(`Preferences already exist for the user with DID: ${did}`);
        }

        await Preferences.insertOne(validation.data);
        return true;
    } catch (e) {
        console.error(e);
        throw new Error('An unexpected error occured, unable to create preferences');
    }
};
