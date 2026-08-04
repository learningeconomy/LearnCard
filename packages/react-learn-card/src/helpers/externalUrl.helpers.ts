export type ExternalUrlOpener = (url: string) => void | Promise<void>;

const defaultOpener: ExternalUrlOpener = url => {
    if (typeof window === 'undefined') return;

    window.open(url, '_blank', 'noopener,noreferrer');
};

let opener: ExternalUrlOpener = defaultOpener;

/**
 * Register a platform-specific way to open external URLs.
 *
 * This package has no native dependencies, so `window.open` is the default. Hosts
 * running inside a native shell should register their own opener at startup —
 * `learn-card-base` registers Capacitor's `Browser.open`, which presents the URL
 * in an in-app browser instead of kicking the user out to Safari.
 *
 * Pass `undefined` to restore the default.
 */
export const setExternalUrlOpener = (fn: ExternalUrlOpener | undefined): void => {
    opener = fn ?? defaultOpener;
};

/** Open a URL outside of the current document, using the registered opener. */
export const openExternalUrl = async (url: string): Promise<void> => {
    if (!url) return;

    await opener(url);
};
