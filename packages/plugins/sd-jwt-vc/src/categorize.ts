export const DEFAULT_SD_JWT_VC_CATEGORY = 'Achievement';

export const SD_JWT_VC_CATEGORY_MAP: Record<string, string> = {
    'urn:eu.europa.ec.eudi:pid:1': 'ID',
    'urn:eudi:pid:1': 'ID',
};

const ID_HINT_SUBSTRINGS = ['/pid/', '/identity/', '/identification/', '/identitycard/'];

export const categorizeSdJwt = (vct: string): string => {
    if (typeof vct !== 'string' || vct.length === 0) return DEFAULT_SD_JWT_VC_CATEGORY;

    if (vct in SD_JWT_VC_CATEGORY_MAP) {
        return SD_JWT_VC_CATEGORY_MAP[vct] as string;
    }

    const lowerVct = vct.toLowerCase();
    for (const hint of ID_HINT_SUBSTRINGS) {
        if (lowerVct.includes(hint)) return 'ID';
    }

    return DEFAULT_SD_JWT_VC_CATEGORY;
};

export const registerSdJwtVctCategory = (vct: string, category: string): void => {
    SD_JWT_VC_CATEGORY_MAP[vct] = category;
};
