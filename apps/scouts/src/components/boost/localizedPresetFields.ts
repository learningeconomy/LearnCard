import type { BoostCMSState } from 'learn-card-base';

export type LocalizedPresetFields = Pick<
    BoostCMSState['basicInfo'],
    'name' | 'description' | 'narrative'
>;

export type BoostPresetLocalization = {
    enabled: boolean;
    contentOptions: { locale?: 'en' };
};

export const getBoostPresetLocalization = (flagValue: unknown): BoostPresetLocalization => {
    const enabled = flagValue === true;

    return {
        enabled,
        contentOptions: enabled ? {} : { locale: 'en' },
    };
};

export const refreshLocalizedPresetFields = (
    current: LocalizedPresetFields,
    previousDefaults: LocalizedPresetFields,
    nextDefaults: LocalizedPresetFields,
    enabled = true
): LocalizedPresetFields => {
    if (!enabled) return current;

    const refreshed = {
        name: current.name === previousDefaults.name ? nextDefaults.name : current.name,
        description:
            current.description === previousDefaults.description
                ? nextDefaults.description
                : current.description,
        narrative:
            current.narrative === previousDefaults.narrative
                ? nextDefaults.narrative
                : current.narrative,
    };

    return refreshed.name === current.name &&
        refreshed.description === current.description &&
        refreshed.narrative === current.narrative
        ? current
        : refreshed;
};
