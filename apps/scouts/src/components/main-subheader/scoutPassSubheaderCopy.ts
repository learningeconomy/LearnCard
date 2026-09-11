import type { ScoutPassCategoryCopy } from '../category-descriptor/scoutPassCategoryCopy';

type SubheaderDisplayCopy = {
    title: string;
    helperText?: string;
    helperTextClickable?: string;
};

type ScoutPassSubheaderCopyArgs = {
    isScoutPass: boolean;
    subheaderType: string;
    count?: number;
    fallback: SubheaderDisplayCopy;
    categoryCopy?: ScoutPassCategoryCopy;
};

const SCOUT_PASS_CATEGORY_SUBHEADER_TYPES = new Set([
    'socialBadge',
    'meritBadge',
    'membership',
    'skill',
]);

export const isScoutPassCategorySubheader = (subheaderType: string): boolean =>
    SCOUT_PASS_CATEGORY_SUBHEADER_TYPES.has(subheaderType);

export const getScoutPassSubheaderDisplayCopy = ({
    isScoutPass,
    subheaderType,
    count,
    fallback,
    categoryCopy,
}: ScoutPassSubheaderCopyArgs): SubheaderDisplayCopy => {
    if (!isScoutPass || !categoryCopy || !isScoutPassCategorySubheader(subheaderType)) {
        return fallback;
    }

    return {
        title: count === 1 ? categoryCopy.titleOne : categoryCopy.titleOther,
        helperText: categoryCopy.helperPrefix,
        helperTextClickable: categoryCopy.helperAction,
    };
};
