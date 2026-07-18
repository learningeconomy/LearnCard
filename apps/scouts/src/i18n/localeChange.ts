export type LocaleStorage = Pick<Storage, 'setItem'>;

export const applyLocaleChange = <T extends string>(
    locale: T,
    setRuntimeLocale: (locale: T) => void,
    setReactLocale: (locale: T) => void,
    storage?: LocaleStorage | null
): void => {
    setRuntimeLocale(locale);
    setReactLocale(locale);

    try {
        storage?.setItem('i18n.language', locale);
    } catch {
        // Locale switching remains functional when persistence is unavailable.
    }
};
