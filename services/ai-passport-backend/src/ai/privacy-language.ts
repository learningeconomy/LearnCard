const supportedLanguages: Record<string, true> = {
    ar: true,
    zh: true,
    nl: true,
    en: true,
    fi: true,
    fr: true,
    de: true,
    hi: true,
    it: true,
    ja: true,
    ko: true,
    no: true,
    nb: true,
    nn: true,
    pl: true,
    pt: true,
    es: true,
    sv: true,
    vi: true,
};
// Locale eligibility is separate from content language detection. We deliberately
// do not infer text language or PII safety from individual Unicode characters.
export class UnsupportedPrivacyLanguageError extends Error {
    readonly languageReason = 'locale';
    constructor() {
        super('Managed privacy does not support the requested locale');
        this.name = 'UnsupportedPrivacyLanguageError';
    }
}
export const assertPrivacyLocale = (locale?: string) => {
    const language = (locale ?? 'en').toLowerCase().split(/[-_]/)[0];
    if (!language || !Object.hasOwn(supportedLanguages, language))
        throw new UnsupportedPrivacyLanguageError();
};
