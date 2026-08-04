export type ExternalUrlOpener = (url: string) => void | Promise<void>;

/**
 * Attachment URLs come from credentials issued by arbitrary third parties, so
 * they are untrusted input. Handing a `javascript:` (or `data:`) URL to
 * `window.open` can execute script in the app's own origin — `noopener` does
 * not prevent that. Only ever open real web URLs.
 */
const isOpenableUrl = (url: string): boolean => {
    try {
        const base = typeof window === 'undefined' ? undefined : window.location?.href;
        const { protocol } = new URL(url, base);

        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
};

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

/**
 * Open a URL outside of the current document, using the registered opener.
 *
 * Non-web schemes are dropped rather than forwarded — see `isOpenableUrl`.
 */
export const openExternalUrl = async (url: string): Promise<void> => {
    if (!url || !isOpenableUrl(url)) return;

    await opener(url);
};
