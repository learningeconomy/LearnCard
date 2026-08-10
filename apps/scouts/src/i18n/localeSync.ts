import type { SupportedLanguage } from './index';

export type LocaleSyncAction =
    | { action: 'none' }
    | { action: 'restore'; locale: SupportedLanguage }
    | { action: 'sync' };

/**
 * Reconcile the displayed ScoutPass locale with the locale saved on the user's
 * global LearnCard Network profile.
 */
export const decideLocaleSync = (
    uiLocale: SupportedLanguage,
    profileLocale: SupportedLanguage | undefined,
    hasManualChoice: boolean,
    tenantSupportsProfileLocale = true,
    hasSavedProfileLocale = profileLocale !== undefined
): LocaleSyncAction => {
    if (!profileLocale) return hasSavedProfileLocale ? { action: 'none' } : { action: 'sync' };
    if (profileLocale === uiLocale) return { action: 'none' };
    if (!tenantSupportsProfileLocale) return { action: 'none' };
    if (!hasManualChoice) return { action: 'restore', locale: profileLocale };
    return { action: 'sync' };
};

type LocaleSyncEffects = {
    changeLocale: (locale: SupportedLanguage) => void;
    updateProfile: (locale: SupportedLanguage) => Promise<void>;
    invalidateProfile: () => Promise<unknown>;
    onError: (error: unknown) => void;
};

/** Apply one reconciliation decision without allowing profile failures to escape. */
export const applyLocaleSyncAction = async (
    action: LocaleSyncAction,
    uiLocale: SupportedLanguage,
    effects: LocaleSyncEffects
): Promise<void> => {
    if (action.action === 'none') return;

    if (action.action === 'restore') {
        effects.changeLocale(action.locale);
        return;
    }

    try {
        await effects.updateProfile(uiLocale);
        await effects.invalidateProfile();
    } catch (error) {
        effects.onError(error);
    }
};
