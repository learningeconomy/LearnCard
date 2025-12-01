import { Preferences } from '.';

import { ThemeEnum } from '../../types/preferences';

export const updatePreferences = async (did: string, theme: ThemeEnum): Promise<boolean> => {
    try {
        const res = await Preferences.updateOne(
            { did },
            { $set: { theme, updatedAt: new Date() } },
            { upsert: false }
        );
        if (res.matchedCount === 0)
            throw new Error('An unexpected error occured, unable to update preferences');
        return true;
    } catch (e) {
        console.error(e);
        throw new Error('An unexpected error occured, unable to update preferences');
    }
};
