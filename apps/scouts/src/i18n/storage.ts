import { LOCALE_STORAGE_KEY, readPersistedLocale } from './localeStorage';

type ClearableStorage = Pick<Storage, 'getItem' | 'setItem' | 'clear'>;

/** Clear app-owned local storage without resetting the user's UI language. */
export const clearStoragePreservingLocale = (storage: ClearableStorage): void => {
    const locale = readPersistedLocale(storage);

    try {
        storage.clear();

        if (locale) storage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
        // Storage failures must not abort the rest of logout cleanup.
    }
};
