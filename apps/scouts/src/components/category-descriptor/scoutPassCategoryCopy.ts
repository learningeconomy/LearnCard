import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

export const SCOUT_PASS_CATEGORY_MESSAGE_KEYS: Partial<Record<BoostCategoryOptionsEnum, string>> = {
    [BoostCategoryOptionsEnum.socialBadge]: 'socialBoosts',
    [BoostCategoryOptionsEnum.meritBadge]: 'meritBadges',
    [BoostCategoryOptionsEnum.membership]: 'troops',
    [BoostCategoryOptionsEnum.skill]: 'competencies',
};

export type ScoutPassCategoryCopy = {
    titleOne: string;
    titleOther: string;
    walletDescription?: string;
    helperPrefix: string;
    helperAction: string;
    descriptor: string;
};

export const getScoutPassCategoryCopy = (
    messages: Record<string, unknown>,
    category: BoostCategoryOptionsEnum
): ScoutPassCategoryCopy | undefined => {
    const key = SCOUT_PASS_CATEGORY_MESSAGE_KEYS[category];
    if (!key) return undefined;

    const read = (field: string): string | undefined => {
        const message = messages[`scoutCategories.${key}.${field}`];
        return typeof message === 'function' ? (message as () => string)() : undefined;
    };

    const titleOne = read('titleOne');
    const titleOther = read('titleOther');
    const helperPrefix = read('helperPrefix');
    const helperAction = read('helperAction');
    const descriptor = read('descriptor');
    if (!titleOne || !titleOther || !helperPrefix || !helperAction || !descriptor) return undefined;

    return {
        titleOne,
        titleOther,
        walletDescription: read('walletDescription'),
        helperPrefix,
        helperAction,
        descriptor,
    };
};
