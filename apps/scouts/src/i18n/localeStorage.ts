export type ReadableLocaleStorage = Pick<Storage, 'getItem'>;

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
        return storage?.getItem('i18n.language') ?? undefined;
    } catch {
        return undefined;
    }
};
