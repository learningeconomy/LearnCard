const LOCALE_STORAGE_KEY = 'i18n.language';

type ClearableStorage = Pick<Storage, 'getItem' | 'setItem' | 'clear'>;

/** Clear app-owned local storage without resetting the user's UI language. */
export const clearStoragePreservingLocale = (storage: ClearableStorage): void => {
    const locale = storage.getItem(LOCALE_STORAGE_KEY);

    storage.clear();

    if (locale) storage.setItem(LOCALE_STORAGE_KEY, locale);
};
