import { PREFERENCES_COLLECTION, MongoPreferencesType } from '@models';
import mongodb from '@mongo';

export const getPreferencesCollection = () => {
    return mongodb.collection<MongoPreferencesType>(PREFERENCES_COLLECTION);
};

export const Preferences = getPreferencesCollection();
