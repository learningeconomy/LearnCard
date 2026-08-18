import { LOCALE_STORAGE_KEY, MANUAL_LOCALE_STORAGE_KEY } from './localeStorage';

export type LocaleStorage = Pick<Storage, 'setItem' | 'removeItem'>;
export type LocaleChangeOptions = { manual?: boolean };

export const applyLocaleChange = <T extends string>(
    locale: T,
    setRuntimeLocale: (locale: T) => void,
    setReactLocale: (locale: T) => void,
    storage?: LocaleStorage | null,
    options: LocaleChangeOptions = {}
): void => {
    setRuntimeLocale(locale);
    setReactLocale(locale);

    try {
        storage?.setItem(LOCALE_STORAGE_KEY, locale);

        if (options.manual ?? true) {
            storage?.setItem(MANUAL_LOCALE_STORAGE_KEY, locale);
        } else {
            storage?.removeItem(MANUAL_LOCALE_STORAGE_KEY);
        }
    } catch {
        // Locale switching remains functional when persistence is unavailable.
    }
};
