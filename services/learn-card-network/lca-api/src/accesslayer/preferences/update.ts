import { Preferences } from '.';

import { ThemeEnum } from '../../types/preferences';

export type UpdatePreferencesInput = {
    theme?: ThemeEnum;
    aiEnabled?: boolean;
    aiAutoDisabled?: boolean;
    analyticsEnabled?: boolean;
    analyticsAutoDisabled?: boolean;
    bugReportsEnabled?: boolean;
    isMinor?: boolean;
};

export const updatePreferences = async (
    did: string,
    input: UpdatePreferencesInput
): Promise<boolean> => {
    try {
        await Preferences.updateOne(
            { did },
            { $set: { ...input, updatedAt: new Date() } },
            { upsert: true }
        );
        return true;
    } catch (e) {
        console.error(e);
        throw new Error('An unexpected error occured, unable to update preferences');
    }
};
