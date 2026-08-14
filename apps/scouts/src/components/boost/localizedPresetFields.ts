import type { BoostCMSState } from 'learn-card-base';

export type LocalizedPresetFields = Pick<
    BoostCMSState['basicInfo'],
    'name' | 'description' | 'narrative'
>;

export const refreshLocalizedPresetFields = (
    current: LocalizedPresetFields,
    previousDefaults: LocalizedPresetFields,
    nextDefaults: LocalizedPresetFields
): LocalizedPresetFields => {
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
