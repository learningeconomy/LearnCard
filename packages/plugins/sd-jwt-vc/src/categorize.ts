export const DEFAULT_SD_JWT_VC_CATEGORY = 'Achievement';

const internalCategoryMap: Record<string, string> = {
    'urn:eu.europa.ec.eudi:pid:1': 'ID',
    'urn:eudi:pid:1': 'ID',
};

export const SD_JWT_VC_CATEGORY_MAP: Readonly<Record<string, string>> = internalCategoryMap;

const ID_HINT_SUBSTRINGS = ['/pid/', '/identity/', '/identification/', '/identitycard/'];

export const categorizeSdJwt = (vct: string): string => {
    if (typeof vct !== 'string' || vct.length === 0) return DEFAULT_SD_JWT_VC_CATEGORY;

    if (vct in internalCategoryMap) {
        return internalCategoryMap[vct] as string;
    }

    const lowerVct = vct.toLowerCase();
    for (const hint of ID_HINT_SUBSTRINGS) {
        if (lowerVct.includes(hint)) return 'ID';
    }

    return DEFAULT_SD_JWT_VC_CATEGORY;
};

export const registerSdJwtVctCategory = (vct: string, category: string): void => {
    internalCategoryMap[vct] = category;
};
