export type ReadableLocaleStorage = Pick<Storage, 'getItem'>;

export const LOCALE_STORAGE_KEY = 'i18n.language';
export const MANUAL_LOCALE_STORAGE_KEY = 'i18n.manualLanguage';

type StorageScope = {
    readonly localStorage?: Storage;
};

/**
 * Obtain localStorage without letting a throwing browser getter crash startup.
 * Some restricted browser contexts throw before any Storage method is called.
 */
export const getLocaleStorage = (
    scope: StorageScope = globalThis as StorageScope
): Storage | undefined => {
    try {
        return scope.localStorage;
    } catch {
        return undefined;
    }
};

/** Read the explicit user locale without propagating storage access failures. */
export const readPersistedLocale = (
    storage: ReadableLocaleStorage | undefined = getLocaleStorage()
): string | undefined => {
    try {
        return storage?.getItem(LOCALE_STORAGE_KEY) ?? undefined;
    } catch {
        return undefined;
    }
};

/** Read the locale explicitly selected during the current signed-out/auth session. */
export const readManualLocaleChoice = (
    storage: ReadableLocaleStorage | undefined = getLocaleStorage()
): string | undefined => {
    try {
        return storage?.getItem(MANUAL_LOCALE_STORAGE_KEY) ?? undefined;
    } catch {
        return undefined;
    }
};
